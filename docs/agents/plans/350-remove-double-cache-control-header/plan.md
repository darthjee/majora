# Plan: Remove double Cache-Control header

Issue: [350-remove-double-cache-control-header.md](../../issues/350-remove-double-cache-control-header.md)

## Overview

Add a custom Tent response middleware that collapses a duplicated `Cache-Control` header
down to a single value — the one produced by `games.middleware.CacheControlMiddleware` on
the Django backend — before the response reaches the client. Register it as the last
middleware for the `.json` proxy rule, in both the dev and prod proxy configurations.

## Context

API JSON responses currently carry two `Cache-Control` header lines, e.g.:

```
cache-control: public, max-age=3600
cache-control: max-age=172800
```

The first (`public, max-age=3600`) is set by `games.middleware.CacheControlMiddleware`
(`source/games/middleware.py`) on the Django side. The second (`max-age=172800`, no
`public`/`private` qualifier) is added upstream, likely by the Tent proxy's own
`default_proxy` handler (`darthjee/tent:0.9.1`, external image — not something this repo
can patch directly). Two `Cache-Control` headers on the same response is invalid/ambiguous
HTTP and leads to unpredictable caching by browsers/intermediate caches.

The fix must stay entirely inside this repo's proxy extension mechanism
(`proxy/extension/`), per Tent's "Extending Tent" mount-based extension pattern
documented in `docs/agents/HOW_TO_USE_DARTHJEE-TENT.md`.

### Important correction vs. the issue text

The issue mentions "following the existing `TestHeaderMiddleware` pattern"
(`proxy/extension/lib/TestHeaderMiddleware.php`), which exposes a
`handle(Request $request, Response $response): void` method. That file is a demo class
that is **not** wired into any rule and does **not** match Tent 0.9.1's real middleware
contract — it was verified against the pinned `darthjee/tent:0.9.1` tag (`Tent\Middlewares\Middleware`
base class): middlewares are registered via the `'class' => 'Tent\\Middlewares\\...'` key in
a rule's `middlewares` array, extend `Tent\Middlewares\Middleware`, and implement
`processResponse(Response $response): Response` (and/or `processRequest(ProcessingRequest
$request): ProcessingRequest`). `Response::headers()` returns a **flat list of raw header
line strings** (e.g. `['Cache-Control: public, max-age=3600', 'Cache-Control: max-age=172800',
...]`, confirmed by `Tent\Middlewares\FileCacheMiddleware`'s own usage of
`foreach ($response->headers() as $headerLine)`), and `Response::setHeaders(array $headers)`
replaces the full list — there is no single-header setter on `Response`. The new middleware
must follow this real contract, not `TestHeaderMiddleware`'s.

All rule middlewares (both `processRequest` and `processResponse`) run in the same list
order (`Tent\RequestHandlers\RequestHandler::applyResponseMiddlewares`), and
`processResponse` runs after the handler has already produced its response. So appending
the new middleware as the last entry in the `.json` rule's `middlewares` list — after
`CacheCleanupMiddleware` and `CacheStalenessMiddleware` — guarantees it sees (and cleans up)
the final response headers.

## Implementation Steps

### Step 1 — Add the middleware class

Create `proxy/extension/lib/CollapseDuplicateHeaderMiddleware.php` (name illustrative — the
proxy agent may pick a more idiomatic name, e.g. `DedupeHeaderMiddleware`):

- `namespace Tent\Middlewares;`
- `class CollapseDuplicateHeaderMiddleware extends Middleware`
- Constructor takes the header name to dedupe (e.g. `Cache-Control`), so the class is
  reusable; `build(array $attributes)` reads it from a `'header'` config key (default to
  `Cache-Control` if omitted, to keep the config declaration terse).
- `processResponse(Response $response): Response`:
  - Iterate `$response->headers()` (list of `"Name: value"` strings).
  - Keep every header line whose name (case-insensitively, split on the first `:`) does not
    match the configured header, plus **only the first** occurrence of a line whose name
    does match (drop subsequent duplicates).
  - Call `$response->setHeaders($filtered)` and `return $response`.
- Add a class-level docblock explaining the purpose (mirrors `TestHeaderMiddleware`'s doc
  style) and correcting the pattern going forward — extend `Middleware`, not a bespoke
  `handle()` method.

### Step 2 — Load the new class

Add a `require_once` line for the new file in `proxy/extension/loader.php`, alongside the
existing requires.

### Step 3 — Register the middleware in both proxy rule files

In both `proxy/prod_configuration/rules/backend.php` and
`proxy/dev_configuration/rules/backend.php`, append a new entry to the `.json` rule's
`middlewares` array, after the existing `CacheCleanupMiddleware`/`CacheStalenessMiddleware`
entries:

```php
[
    'class'  => 'Tent\\Middlewares\\CollapseDuplicateHeaderMiddleware',
    'header' => 'Cache-Control',
]
```

Keep both files in sync (they are currently near-duplicates differing only in `host`).

### Step 4 — Tests

Add `proxy/extension/tests/CollapseDuplicateHeaderMiddlewareTest.php` (PHPUnit, same style
as `TestHeaderMiddlewareTest.php`, run via `docker-compose run proxy_tests`). Cover:

- A response with two `Cache-Control` header lines is collapsed to only the first.
- A response with a single `Cache-Control` header line is left unchanged.
- A response with no `Cache-Control` header line is left unchanged.
- Other header lines are preserved untouched and in order.

Construct a real `Tent\Models\Response` instance (available at test time via
`tests/bootstrap.php`, which loads the full Tent framework) rather than a mock, since the
behavior under test is the header-list transformation itself — assert via
`$response->headers()` after calling `processResponse()`.

## Files to Change

- `proxy/extension/lib/CollapseDuplicateHeaderMiddleware.php` — new middleware class.
- `proxy/extension/loader.php` — require the new file.
- `proxy/extension/tests/CollapseDuplicateHeaderMiddlewareTest.php` — new tests.
- `proxy/prod_configuration/rules/backend.php` — register the middleware.
- `proxy/dev_configuration/rules/backend.php` — register the middleware.

## Notes

- No CircleCI job currently runs `proxy/extension/tests` (only `upload_extension`/
  `upload_proxy_files` deploy steps reference `proxy/`); there is no `## CI Checks` entry
  to add. Tests are run locally via `docker-compose run proxy_tests`. Consider flagging
  this CI gap separately (out of scope for this issue) — the `infra` agent could wire a
  CircleCI job for `proxy/extension/tests` in a follow-up.
- The exact duplicate-drop order (first line wins) matches the reproduction in the issue,
  where the Django-originated value (`public, max-age=3600`) appears before the
  proxy-injected one (`max-age=172800`); this should be verified against a live/dev capture
  of the actual header order if possible before assuming "first wins" universally.
- No backend, frontend, or Navi changes are required — this is a proxy-only fix.

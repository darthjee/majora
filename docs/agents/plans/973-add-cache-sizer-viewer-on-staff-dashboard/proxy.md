# Proxy Plan: Add cache sizer viewer on staff dashboard

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the endpoint and error-shape contract described in `plan.md`'s "Shared contracts" —
`GET /staff/cache/size.json` returning `{"size": <bytes>}` on success, `403` when not admin/
staff, and a propagated upstream status/body when `/users/status.json` itself fails. Also
produces the `$cacheFolder` config variable (proxy-internal, no other agent depends on its exact
value).

## Implementation Steps

### Step 1 — Extract `$cacheFolder` config

- Add `$cacheFolder = './cache';` to `proxy/prod_configuration/locals.php.sample` (the real
  `proxy/prod_configuration/locals.php` is gitignored/manually managed in production — do **not**
  create or edit it).
- Create a new **committed** `proxy/dev_configuration/locals.php` containing only
  `$cacheFolder = './cache';`, and add `require_once __DIR__ . '/locals.php';` near the top of
  `proxy/dev_configuration/configure.php` (dev currently has no locals-file indirection at all —
  mirror prod's `require_once` placement, i.e. before the `rules/*.php` requires).
- Update both `proxy/prod_configuration/rules/backend.php` and
  `proxy/dev_configuration/rules/backend.php` to reference `$cacheFolder` instead of the two
  hardcoded `'./cache'` literals (`CacheCleanupMiddleware`'s and `CacheStalenessMiddleware`'s
  `location` config).
- Only the cache folder path is in scope — leave `$backendHost` and any other dev-inline values
  untouched.

### Step 2 — `CacheSizeHandler`

Create `proxy/extension/lib/handlers/CacheSizeHandler.php`, `class CacheSizeHandler extends
RequestHandler` (namespace `Tent\RequestHandlers`), following `DeleteHandler`'s shape as the
closest existing precedent (backend check-call → local work → response):

- Constructor: `(string $host, ?HttpClientInterface $httpClient = null, string $cachePath = '')`,
  defaulting `$httpClient` to `new CurlHttpClient()` (same as `DeleteHandler`/`UploadHandler`).
  No filesystem-mutation is involved (read-only size check), so no `SecurePhotoStorage`-style
  guard is needed here — flag this explicitly in the class docblock so it's clear this is a
  deliberate omission, not an oversight, given the future "clear cache" handler (see the issue's
  "Future work" section) *will* need one.
- Static `build(array $params): self` factory reading `params['host']` and `params['cache_path']`
  — this is what the rule's config array (Step 3) feeds in.
- `protected function processsRequest(RequestInterface $request): Response`:
  1. Filter the incoming headers via `ForwardedHeaderFilter::filter($request->headers())` (same
     as `DeleteHandler`) and call `GET $host/users/status.json` with them.
  2. If that call's `httpCode !== 200`, throw a `BackendErrorException($result['httpCode'],
     $result['body'])` — caught below and forwarded as-is, satisfying the "propagate upstream
     failure" contract without extra code (this is exactly `DeleteHandler::requestDeletablePath`'s
     existing pattern, reused for the same reason).
  3. If `httpCode === 200`, `json_decode` the body. If it doesn't decode, or `logged_in` isn't
     `true`, or neither `is_staff` nor `is_superuser` is `true`, throw `BackendErrorException(403,
     '{"error":"Forbidden"}')` (any reasonable body — the frontend doesn't parse it, see
     `plan.md`).
  4. Otherwise, compute the total size in bytes of `$cachePath` (recursive sum of file sizes —
     e.g. via `RecursiveIteratorIterator`/`RecursiveDirectoryIterator` or `SplFileInfo::getSize()`
     over a directory walk; no existing helper for this in the codebase, so it's new) and return
     `new Response(['httpCode' => 200, 'headers' => ['Content-Type' => 'application/json'], 'body'
     => json_encode(['size' => $size])])`.
  5. `catch (BackendErrorException $e)`, same as `DeleteHandler`: `return new Response(['httpCode'
     => $e->httpCode(), 'body' => $e->body()]);`.

### Step 3 — Wire the rule

Create `proxy/prod_configuration/rules/cache.php` and `proxy/dev_configuration/rules/cache.php`
(new files, mirroring `delete.php`'s shape):

```php
<?php

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'class'      => 'Tent\RequestHandlers\CacheSizeHandler',
        'host'       => $backendHost,          // dev: 'http://backend:8080' literal, matching backend.php
        'cache_path' => $cacheFolder,
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/staff/cache/size.json', 'type' => 'exact'],
    ],
]);
```

Require the new file from both `configure.php`s, placed before `rules/backend.php`'s require (so
the exact-match rule wins over `backend.php`'s catch-all `.json` `ends_with` matcher) — same
ordering reasoning as `delete.php`, which is required before `backend.php` today.

### Step 4 — Tests

Add `proxy/extension/tests/handlers/CacheSizeHandlerTest.php`, following
`DeleteHandlerTest.php`'s shape (temp directory in `setUp`/`tearDown` instead of touching a real
cache folder, a fake/mock `HttpClientInterface` for the `/users/status.json` call). Cover:

- `is_staff: true` / `is_superuser: true` (either alone) → `200` with the correct summed byte
  size of files placed in the temp directory.
- `logged_in: false`, or `logged_in: true` with both flags `false` → `403`.
- `/users/status.json` returning a non-`200` (e.g. `500`) → that same status/body propagated
  as-is, not collapsed to `403`.
- Empty cache directory → `200` with `size: 0`.

## Files to Change

- `proxy/prod_configuration/locals.php.sample` — add `$cacheFolder`.
- `proxy/dev_configuration/locals.php` — new file, `$cacheFolder` only.
- `proxy/dev_configuration/configure.php` — require the new `locals.php`.
- `proxy/prod_configuration/rules/backend.php`, `proxy/dev_configuration/rules/backend.php` —
  reference `$cacheFolder` instead of `'./cache'`.
- `proxy/extension/lib/handlers/CacheSizeHandler.php` — new handler.
- `proxy/prod_configuration/rules/cache.php`, `proxy/dev_configuration/rules/cache.php` — new
  rule files.
- `proxy/prod_configuration/configure.php`, `proxy/dev_configuration/configure.php` — require the
  new rule file.
- `proxy/extension/tests/handlers/CacheSizeHandlerTest.php` — new tests.

## CI Checks

- `proxy/extension`: `docker-compose run --rm proxy_tests` (CI job: `proxy_extension_tests`)

## Notes

- No path-traversal concern for this handler — `$cachePath` is a fixed config value, never
  derived from request input. The future "clear cache" handler (out of scope here) is where that
  guard actually matters, per the issue's "Future work" section.
- `is_superuser` implies staff-equivalent access here per the issue's explicit "`is_staff` OR
  `is_superuser`" decision — don't require both.

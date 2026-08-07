# Plan: improve domain caching

Issue: [1011-improve-domain-caching.md](../issues/1011-improve-domain-caching.md)

## Overview

Collapse the per-domain loop in `proxy/prod_configuration/rules/games.php`
(one Tent rule + one cache directory per entry in `$gamesJsonCacheDomains`)
into a single wildcard-domain rule sharing one cache folder. Per-domain
isolation moves from the filesystem layout to the cache key, via a new
custom `Tent\Cache\RequestHasher` implementation that hashes the request's
domain together with its query string. `$gamesJsonCacheDomains` and
`CachePathSanitizer` are retired, and the now-inert `CacheCleanupMiddleware`
wiring is dropped from this rule.

This is a proxy-only change — only the `proxy` agent has work; no other
agent's files are touched.

## Context

- Tent's config files (`locals.php`, `rules/*.php`) are `require_once`d
  once at process boot (`configure.php`), so there is no per-request hook
  to compute `$domain` dynamically inside `locals.php` — the issue's
  original literal premise doesn't fit Tent's execution model.
- Tent's domain matcher (`RequestMatcher::matchRequestDomain()`) already
  supports a `%` wildcard (SQL LIKE semantics) and reads the domain via
  `$request->domain()` (the `Host` header, port stripped, case-insensitive
  compare) — this is the same accessor the new hasher should use, for
  consistency with how the rule itself decides "which domain".
- `Tent\Utils\CacheFilePath::path()` interpolates a `RequestHasher`'s
  return value directly into `{hash}.body.dat` / `{hash}.meta.json` with
  **no sanitization on Tent's side** — the `RequestHasher` interface's own
  docblock makes producing a filesystem-safe string entirely the
  implementation's responsibility. SHA-256 hex output is inherently
  filesystem-safe, which is why hashing (not the raw domain) is the
  chosen mechanism — it needs no bespoke sanitizer, unlike today's
  directory-per-domain approach which requires `CachePathSanitizer`.
- The hash must combine domain **and** query string, not replace the
  query with the domain — otherwise two different domains requesting the
  same query string would collide now that they no longer sit in separate
  directories.
- The backend's `GAMES_JSON_CACHE_DOMAINS` env var (`backend/games/views/games/games_list.py`,
  deny-by-default via `X-Skip-Cache`) is untouched by this issue and
  becomes the **sole** authority over which domains' `games.json`
  responses actually get persisted to disk — the proxy rule now matches
  every domain, but a response the backend marks `X-Skip-Cache` still
  never reaches the proxy's cache regardless of the rule's domain match.
- `CacheCleanupMiddleware` is currently wired into each per-domain rule
  (`clear: ['collection', 'entity']` + `$cacheCleanupMap`) but only acts
  on mutating HTTP methods, while this rule's matcher is `GET`-only —
  it never actually fires today, so dropping it when collapsing to one
  rule is a no-op behaviorally.

## Implementation Steps

### Step 1 — Add a `HostQueryRequestHasher` implementation

Create a new class implementing `Tent\Cache\RequestHasher` that computes
the cache-key hash from both the request's domain and its query string,
e.g.:

```php
hash('sha256', $request->domain() . '|' . $request->query())
```

Follow the existing convention in `proxy/extension/lib` (see
`CachePathSanitizer`) of implementing framework-facing contracts under a
`Tent\*` namespace even though the file itself lives under
`proxy/extension/lib/`. Place it under `proxy/extension/lib/cache/` (new
subfolder, mirroring Tent's own `lib/cache/` grouping for
`RequestHasher`/`QueryRequestHasher`), implement both `hash()` and the
static `build()` factory method required by the interface.

### Step 2 — Register the new class in the extension loader

Add a `require_once __DIR__ . '/lib/cache/HostQueryRequestHasher.php';`
line to `proxy/extension/loader.php`, grouped near the other `support`/
custom classes (loader.php has no autoloading — every extension class is
explicitly required there).

### Step 3 — Replace the per-domain loop with a single rule

Rewrite `proxy/prod_configuration/rules/games.php`:
- Remove the `foreach ($gamesJsonCacheDomains as $domain)` loop and the
  `CachePathSanitizer`-derived `$domainCacheLocation`.
- Build a single `Configuration::buildRule()` call matching
  `['method' => 'GET', 'uri' => '/games.json', 'type' => 'exact', 'domain' => '%']`.
- Point `cache` at one shared folder (e.g. `"$cacheFolder/games_json"`,
  no sanitization needed since it's a static string, not
  request/config-list-derived).
- Pass `'request_hasher' => ['class' => \Tent\Cache\HostQueryRequestHasher::class]`
  (per `DefaultProxyRequestHandler::buildRequestHasher()`'s `request_hasher`
  param contract) so `FileCacheMiddleware`/`FileCache` use the new hasher
  instead of the default `QueryRequestHasher`.
- Keep `'skip_cache_header' => 'X-Skip-Cache'` and the
  `SetClientIpMiddleware` + `CacheStalenessMiddleware` middlewares
  (update their `location` to the new shared folder). Drop the
  `CacheCleanupMiddleware` entry entirely (see Context above).

### Step 4 — Retire `$gamesJsonCacheDomains` and `CachePathSanitizer`

- Remove the `$gamesJsonCacheDomains` array and its doc comment from
  `proxy/prod_configuration/locals.php.sample`.
- Search the whole `proxy/` tree for any remaining reference to
  `$gamesJsonCacheDomains` or `CachePathSanitizer` (besides
  `CachePathSanitizer.php` itself and its test) and remove them; if
  `CachePathSanitizer` ends up with no remaining callers, delete
  `proxy/extension/lib/support/CachePathSanitizer.php`,
  `proxy/extension/tests/support/CachePathSanitizerTest.php`, and its
  `require_once` line in `proxy/extension/loader.php`.

### Step 5 — Tests

- Add a unit test for `HostQueryRequestHasher` under
  `proxy/extension/tests/cache/HostQueryRequestHasherTest.php` (mirror
  the style of `CachePathSanitizerTest.php`): different domains with the
  same query string must hash differently; the same domain+query must
  hash identically; output must match `hash('sha256', ...)` format.
- Update or remove any existing test(s) that exercised the old
  `games.php` per-domain-loop / `CachePathSanitizer` behavior, if any
  exist under `proxy/extension/tests/`.

## Files to Change

- `proxy/extension/lib/cache/HostQueryRequestHasher.php` — new
  `RequestHasher` implementation hashing domain + query string.
- `proxy/extension/loader.php` — require the new hasher class (and drop
  `CachePathSanitizer`'s require line if it becomes dead code).
- `proxy/prod_configuration/rules/games.php` — single wildcard-domain
  rule replacing the per-domain loop.
- `proxy/prod_configuration/locals.php.sample` — remove
  `$gamesJsonCacheDomains` and its doc comment.
- `proxy/extension/lib/support/CachePathSanitizer.php` — delete, if no
  longer referenced anywhere.
- `proxy/extension/tests/support/CachePathSanitizerTest.php` — delete
  alongside it.
- `proxy/extension/tests/cache/HostQueryRequestHasherTest.php` — new
  test for the hasher.

## CI Checks

- `proxy/extension`: `vendor/bin/phpunit --bootstrap tests/bootstrap.php tests` (CI job: `proxy_extension_tests`)

## Notes

- Confirm no other rule file references `$gamesJsonCacheDomains` or
  `$domainCacheLocation` from `games.php` before deleting
  `CachePathSanitizer` — it's currently only used there, but re-check at
  implementation time in case that's changed.
- The shared cache folder name (`games_json` in Step 3) is a suggestion;
  any static, non-request-derived name works since it no longer needs
  per-domain sanitization.

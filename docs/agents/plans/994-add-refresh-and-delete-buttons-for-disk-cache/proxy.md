# Proxy Plan: Add refresh and delete buttons for disk cache

Main plan: [plan.md](plan.md)

## Shared contracts

This agent must produce the endpoint described in `plan.md`'s "Shared contracts" section:

- `DELETE /staff/cache/disk.json` → `204 No Content` on success; `403`
  `{"error":"Forbidden"}` when not staff/superuser; backend `/users/status.json` failures
  forwarded as-is.

## Context

`proxy/extension/lib/handlers/CacheSizeHandler.php` (handles `GET /staff/cache/size.json`) has a
private `requireStaffAccess(array $headers): void` that calls the backend's
`GET /users/status.json`, throws `BackendErrorException` forwarding a non-200 backend response,
and throws a 403 `BackendErrorException` when the caller isn't logged in or isn't staff/superuser.
This logic needs to be reused by a new handler, not duplicated.

Note: `CacheSizeHandler` was recently refactored (issue #993) to delegate its actual size
computation to a `DirectorySizeCalculator` / `DirectorySizeStrategyRegistry` strategy pattern
(`php_walk` vs `du`). That refactor only touched size *computation* — `requireStaffAccess()` is
unchanged and still the extraction target. There is no need to give the new delete operation a
similar pluggable-strategy treatment; a plain recursive PHP delete is sufficient (Clear Cache is a
rare, on-demand staff action, not a hot path like the size check).

Files referenced as existing patterns:
- `proxy/extension/lib/handlers/CacheSizeHandler.php` — auth-check source, response/error shaping
  conventions.
- `proxy/extension/lib/support/BackendClient.php` — how handlers call the backend.
- `proxy/extension/lib/exceptions/BackendErrorException.php` — the exception type
  `requireStaffAccess` throws.
- `proxy/extension/lib/support/CachePathSanitizer.php` / `PathTraversalGuard.php` /
  `ForwardedHeaderFilter.php` — existing precedent for standalone, composed support classes (as
  opposed to shared base-class logic); `RequestHandler` itself lives in the external
  `darthjee/tent` framework, not this repo, so it isn't ours to extend.
- `proxy/extension/tests/handlers/CacheSizeHandlerTest.php` — test conventions for this handler
  family (fake `HttpClientInterface`, `ProcessingRequest` builder helpers, asserting on
  `Response::httpCode()`/`body()`).
- `proxy/dev_configuration/rules/cache.php` / `proxy/prod_configuration/rules/cache.php` — where
  the new route is registered.
- `proxy/extension/loader.php` — manual `require_once` list; new classes must be added here or
  they won't be autoloaded.

## Implementation Steps

### Step 1 — Extract `StaffAccessGuard`

Create `proxy/extension/lib/support/StaffAccessGuard.php`, namespace `Tent\RequestHandlers`, with
a static method:

```php
public static function requireStaffAccess(BackendClient $client, array $headers): void
```

Move `CacheSizeHandler::requireStaffAccess()`'s body there verbatim (same `BackendErrorException`
throws, same logic). Update `CacheSizeHandler` to call
`StaffAccessGuard::requireStaffAccess($this->client, $headers)` instead of its own private method,
and delete the now-unused private method.

Add `require_once __DIR__ . '/lib/support/StaffAccessGuard.php';` to `proxy/extension/loader.php`,
placed alongside the other `support/` requires (before `CacheSizeHandler.php`'s require, since it
depends on it).

### Step 2 — New `CacheClearHandler`

Create `proxy/extension/lib/handlers/CacheClearHandler.php`, namespace `Tent\RequestHandlers`,
extending `RequestHandler`, following `CacheSizeHandler`'s shape:

- Constructor: `(string $host, ?HttpClientInterface $httpClient = null, string $cachePath = '')`
  — no need for the `$cacheSizeTool`/`$calculator` params `CacheSizeHandler` has, since this
  handler doesn't compute a size.
- `static build(array $params): self` reading `host` and `cache_path` from `$params`, same as
  `CacheSizeHandler::build()`.
- `protected function processsRequest(RequestInterface $request): Response` (note the
  double-`s` method name — matches the base class's actual signature, not a typo to fix):
  1. Call `StaffAccessGuard::requireStaffAccess($this->client, $request->headers())`, catching
     `BackendErrorException` the same way `CacheSizeHandler` does.
  2. Recursively delete every file under the configured cache path, leaving the folder itself and
     its subdirectory structure in place (see helper method below).
  3. Return `new Response(['httpCode' => 204])` (no body, no `Content-Type` header needed).
- Private helper, e.g. `private function clearCacheContents(): void`: if `is_dir($this->cachePath)`
  is false, return immediately (nothing to clear, same "missing folder is a no-op" precedent as
  `PhpWalkDirectorySizeStrategy::sizeOf()`). Otherwise walk the tree with
  `RecursiveIteratorIterator` + `RecursiveDirectoryIterator` (child-first order, e.g.
  `RecursiveIteratorIterator::CHILD_FIRST`, so subdirectories are empty by the time they're
  reached) and `unlink()` every file, `rmdir()` every now-empty subdirectory — but never
  `rmdir()` the configured `$cachePath` root itself.
- No `SecurePhotoStorage`/`PathTraversalGuard` usage needed — `$cachePath` is a fixed,
  config-supplied value, never derived from request input (same reasoning already documented in
  `CacheSizeHandler`'s class docblock).

### Step 3 — Register the route

Add a second `Configuration::buildRule([...])` block to both
`proxy/dev_configuration/rules/cache.php` and `proxy/prod_configuration/rules/cache.php`:

```php
Configuration::buildRule([
    'handler' => [
        'class'      => 'Tent\RequestHandlers\CacheClearHandler',
        'host'       => 'http://backend:8080',
        'cache_path' => $cacheFolder,
    ],
    'matchers' => [
        ['method' => 'DELETE', 'uri' => '/staff/cache/disk.json', 'type' => 'exact'],
    ],
]);
```

Reuses the same `$cacheFolder` variable already in scope in that file. Leave the existing
`CacheSizeHandler` rule block untouched.

Add `require_once __DIR__ . '/lib/handlers/CacheClearHandler.php';` to
`proxy/extension/loader.php`, after the `CacheSizeHandler.php` require.

## Files to Change

- `proxy/extension/lib/support/StaffAccessGuard.php` — new, extracted auth check.
- `proxy/extension/lib/handlers/CacheSizeHandler.php` — delegate to `StaffAccessGuard`, remove the
  now-duplicate private method.
- `proxy/extension/lib/handlers/CacheClearHandler.php` — new handler for
  `DELETE /staff/cache/disk.json`.
- `proxy/extension/loader.php` — require the two new files.
- `proxy/dev_configuration/rules/cache.php` — new rule block.
- `proxy/prod_configuration/rules/cache.php` — new rule block.
- `proxy/extension/tests/support/StaffAccessGuardTest.php` — new; cover logged-out, staff, and
  superuser-only cases, plus a non-200 backend response being forwarded as-is (this coverage
  currently lives inline in `CacheSizeHandlerTest.php` — move/duplicate it here as appropriate).
- `proxy/extension/tests/handlers/CacheClearHandlerTest.php` — new, mirroring
  `CacheSizeHandlerTest.php`'s structure: staff/superuser gets `204`, non-staff gets `403`,
  backend-status failure is forwarded, plus new coverage specific to the delete behavior — files
  under the cache path are removed, the cache folder itself survives, subdirectories are removed,
  and a missing cache folder is a no-op `204` (not an error).
- `proxy/extension/tests/handlers/CacheSizeHandlerTest.php` — update/trim now that
  `requireStaffAccess` moved to `StaffAccessGuard` (whatever the existing auth-check test cases
  become once they're covered by `StaffAccessGuardTest.php` instead — avoid testing the same auth
  logic twice at two layers with the exact same cases).

## CI Checks

- `proxy/extension`: `vendor/bin/phpunit --bootstrap proxy/extension/tests/bootstrap.php proxy/extension/tests` (CI job: `proxy_extension_tests`)

## Notes

- `CacheClearHandler`'s own class docblock should document the endpoint the same way
  `CacheSizeHandler`'s does (this repo's established precedent for proxy-level endpoints — see
  the issue's "Docs" note: `docs/agents/access-control/staff-cache.md` intentionally stays
  untouched, proxy endpoints are self-documented in the handler class instead).
- Response code intentionally `204` (no body) to match the memory-cache clear endpoint's shape
  (`DELETE /staff/cache.json`, backend/Django) exactly, per the issue's decided design.

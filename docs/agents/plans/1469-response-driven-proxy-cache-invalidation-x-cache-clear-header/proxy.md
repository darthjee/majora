# Proxy Plan: Response-driven proxy cache invalidation (X-Cache-Clear header)

Main plan: [plan.md](plan.md)

## Shared contracts

The proxy **consumes** `X-Cache-Clear` from backend responses: comma-separated literal `.json` paths. It is sent only on the staff-origin finalize 200 that carries `previous_path`, and on the staff photo delete 204. The proxy must never forward it to the client and never act on a client-supplied one.

## Implementation Steps

### Step 1 — `ResponseCacheClearer` support class

Add `proxy/extension/lib/support/ResponseCacheClearer.php`:

- Built with the cache folder path (a `Tent\Models\FolderLocation`), wrapping Tent's `Tent\Content\CacheDirCleaner::cleanPath()` (already scoped to the cache base path and used by `CacheCleanupMiddleware`).
- `clearFrom(array $responseHeaders, int $httpCode): void` — no-op unless 2xx; finds `X-Cache-Clear` case-insensitively in the raw header lines returned by `BackendClient::request()`; splits on commas, trims, drops empties.
- Validates every entry before clearing: must start with `/`, end in `.json`, contain no `..`/`.` segments, backslashes, NUL or query/fragment; invalid entries are skipped (logged), the rest still cleared. Reuse `PathTraversalGuard` if it fits.
- PHPUnit tests: valid list cleared, invalid/traversal entries skipped, non-2xx ignored, missing header no-op, case-insensitive header name.

### Step 2 — Wire it into the handlers

- `UploadHandler` / `UploadStatusClient`: expose the headers of the `uploaded` finalize response and call the clearer after a successful finalize (alongside #1472's `previous_path` old-file deletion).
- `DeleteHandler` (staff rule from #1472): call the clearer with the backend `DELETE` response.
- Pass the cache folder to both handlers' `build()` (e.g. a `cache_path` param set to `$cacheFolder`, same as `rules/cache.php`) in **both** `proxy/dev_configuration/rules/` and `proxy/prod_configuration/rules/` (`uploads.php`, `delete.php` / staff delete rule). The handler stays functional without it (clearing skipped).
- Ensure the client response is built by the handler without the backend's `X-Cache-Clear` (assert in tests); `ForwardedHeaderFilter` keeps not allow-listing it.
- Tests for both handlers: header present → paths cleared and absent from the client response; failure responses → nothing cleared.

## Files to Change

- `proxy/extension/lib/support/ResponseCacheClearer.php` (new) — parse, validate, clear.
- `proxy/extension/lib/handlers/UploadHandler.php`, `proxy/extension/lib/support/UploadStatusClient.php` — expose finalize headers, call clearer.
- `proxy/extension/lib/handlers/DeleteHandler.php` — call clearer on backend DELETE success.
- `proxy/dev_configuration/rules/{uploads,delete}.php` (+ staff delete rule), `proxy/prod_configuration/rules/...` — `cache_path`.
- `proxy/extension/tests/...` — specs.

## CI Checks

- `proxy`: `vendor/bin/phpcs --standard=proxy/phpcs.xml proxy` and `vendor/bin/phpunit` via docker-compose (CI jobs: `Check PHP Lint` / extension tests).

## Notes

- Depends on #1472 for the staff delete rule and `previous_path` handling.
- Confirm how Tent lays out `PrivateRequestHasher` entries; if they don't live under the path directory cleared by `cleanPath`, note it (10s staleness check bounds the window).
- `security` should review the header parsing and path guard.

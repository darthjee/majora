# `no-cache` directive in CacheControlMiddleware
Add a `directive` attribute to `CacheControlMiddleware` (e.g. `'directive' => 'no-cache'`). When it
is set, the middleware emits `Cache-Control: <directive>` and ignores `maxAgeSeconds`. When it is
not set, the existing `maxAgeSeconds` behavior is unchanged.

Tests:
- `directive => 'no-cache'` emits `Cache-Control: no-cache`.
- `directive` takes precedence when `maxAgeSeconds` is also set.
- Existing `maxAgeSeconds` behavior is unchanged.
- The header is also set on a `304` response.

## Files to Change
- `proxy/extension/lib/middlewares/CacheControlMiddleware.php` — add the `directive` attribute.
- `proxy/extension/tests/middlewares/CacheControlMiddlewareTest.php` — add the cases above.

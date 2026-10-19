# Add BearerSkipCacheMiddleware

Add `Tent\Middlewares\BearerSkipCacheMiddleware` in
`proxy/extension/lib/middlewares/BearerSkipCacheMiddleware.php`. Follow
`SetClientIpMiddleware`'s shape: a class docblock that explains why it exists and shows a
configuration example, a constructor, a `static build(array $attributes)` and
`processRequest(ProcessingRequest $request)`.

Attributes:

- `header` (string, required or defaulting to `X-Skip-Cache`): the marker header to set to `true`.
- `skipWhenMissing` (string, optional, default `''`): when non-empty, the marker is **also** set
  when the named request header is missing or empty after trimming. The private rule uses it with
  `X-Cache-Token` for the second guard ("never store or serve an entry without `X-Cache-Token`").

Behaviour in `processRequest`:

1. Join every `Authorization` header value (match the name case-insensitively, the way
   `SetClientIpMiddleware::removeHeader` does) with `,`.
2. If the joined value matches `/(^|,)\s*bearer(\s|$)/i`, set the marker header to `true`.
3. Otherwise, if `skipWhenMissing` is configured and that header is absent or blank, set the
   marker as well.
4. Never strip or modify any other header, including an inbound copy of the marker.

Unit tests in `proxy/extension/tests/middlewares/BearerSkipCacheMiddlewareTest.php`:

- The marker is set for `Bearer x`, `bearer x`, `BEARER x`, `Bearer\tx`, leading spaces, a lone
  `Bearer`, and `Token x, Bearer y` (one header with a comma, and two separate headers).
- The marker is not set for `Token x`, a missing `Authorization`, `Basic x` or `Bearerish x`.
- `build()` respects a custom `header` name.
- With `skipWhenMissing: X-Cache-Token`: a missing or empty token sets the marker, and a present
  token with a non-Bearer `Authorization` does not.
- An inbound marker header is left as it is.

## Files to Change

- `proxy/extension/lib/middlewares/BearerSkipCacheMiddleware.php` — new middleware.
- `proxy/extension/tests/middlewares/BearerSkipCacheMiddlewareTest.php` — unit tests.

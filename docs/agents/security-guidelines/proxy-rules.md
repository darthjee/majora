# Insecure Proxy Rules

- Tent proxy rules (`proxy/*/rules/*.php`) must route only the intended URL patterns to each upstream — overly broad patterns (e.g. `.*` matching everything) can expose unintended paths.
- Rules that proxy to the Django backend must not forward the raw `Authorization` header from the client to Django unless Django explicitly expects and validates it.
- Rules should restrict forwarded HTTP methods to those the upstream handler actually uses; do not forward `PUT`, `DELETE`, or `PATCH` to an endpoint that only handles `GET`.
- If Tent is configured to cache a route, confirm that the route serves identical content to all clients (unauthenticated public data) — never cache responses that contain user-specific data.
- **`X-Skip-Cache` header (cache bypass):** Majora's proxy rules set `'skip_cache_header' => 'X-Skip-Cache'`, meaning any request that carries this header bypasses the Tent cache entirely (no read-side cache and no cached responses are served).

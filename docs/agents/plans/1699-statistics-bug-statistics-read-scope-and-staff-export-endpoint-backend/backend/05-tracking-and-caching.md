# Middleware exemption and caching

- `StatisticsSessionMiddleware` skips the export route through an exact-route exemption (same
  short-circuit as `_skip_requested`: `request.statistics_session = None`, no visit, no cookie).
  Match the request path exactly, not by prefix.
- The response carries `X-Skip-Cache: true` (from `@restricted`) and
  `Cache-Control: private, no-store`; make sure `CacheControlMiddleware` does not overwrite it.

Tests: export requests by staff and by a scoped token create no `Session` or `Visit` and set no
statistics cookie; a sibling statistics route is still tracked; response headers carry
`X-Skip-Cache` and `Cache-Control: private, no-store`.

## Files to Change

- `backend/statistics/middleware.py` — exact-route exemption.
- `backend/statistics/tests/` — middleware exemption tests.
- `backend/staff/views/staff_statistics_export.py` — `Cache-Control` header.
- `backend/staff/tests/` — header tests.

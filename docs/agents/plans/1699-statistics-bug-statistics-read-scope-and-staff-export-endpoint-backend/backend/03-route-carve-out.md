# Exact-route carve-out

Add an exact-route allow-list next to `EXCLUDED_ROUTE_PREFIXES` (for example
`SCOPED_STAFF_ROUTES = ('staff/statistics/export.json',)`), and make `is_excluded_route` return
`False` for an exact match only. Use the same function in the token-scope coverage test so the
export view must declare `@token_scopes` while every other `staff/` route stays excluded.

Tests: the carve-out matches only the exact route (not a prefix, not a sibling such as
`staff/statistics/visits.json`); a scoped token on any other staff route, with or without
`statistics:read`, gets `403` `token_not_allowed`; the coverage test passes.

## Files to Change

- `backend/accounts/authentication.py` — exact-route allow-list in `is_excluded_route`.
- `backend/accounts/tests/api_token_exclusions_test.py` — carve-out and non-carve-out cases.
- `backend/accounts/tests/token_scopes_coverage_test.py` — only if it needs to know about the
  allow-list beyond `is_excluded_route`.

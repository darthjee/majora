# Route pattern helper

Add a small helper returning the stored path value for a request:

- `django.urls.resolve(request.path_info)`; return `match.route` (e.g.
  `games/<slug:game_slug>/documents/<int:id>.json`).
- `Resolver404` → the fixed marker `unresolved`.
- Never the query string; truncate to 255 characters.
- In-memory URL matching only (no database query).

The middleware computes it once per tracked request and stores it on the request (e.g.
`request.statistics_route`) so `attach_statistics_session` and `track_visit` reuse it.
Untracked paths and skip-header requests never compute or store it.

Tests: a parametrised route stores the pattern (a device-authorization poll URL stores no
`uuid`), a 404 path stores `unresolved`, a query string is never included, truncation at 255.

## Files to Change

- `backend/statistics/route_pattern.py` — new helper.
- `backend/statistics/tests/route_pattern_test.py` — new tests.

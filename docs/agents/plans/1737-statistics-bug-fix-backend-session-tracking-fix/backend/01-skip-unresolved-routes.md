# Skip unresolved routes

Requests to paths that match no route (404 on unknown `.json` paths, bots) produced most of the
inflated sessions. Treat them like a skipped request.

- In `StatisticsSessionMiddleware.__call__`, compute `route_pattern(request)` before any
  lookup. When it returns `route_pattern.UNRESOLVED`, set `request.statistics_session = None`
  and return `self.get_response(request)` directly: no domain lookup, no session lookup, no
  visit, no `_backfill_user`, no `Set-Cookie`. Keep `request.statistics_route` set so the
  marker stays available to callers; `request.statistics_session_created` stays `None`.
- Fold the check into `_skip_requested` (or a sibling helper) so the "untracked" rules live in
  one place: exact `UNTRACKED_PATHS`, a valid skip header, or no matching route. Update the
  class docstring accordingly.
- `route_pattern.UNRESOLVED` stays (existing rows, `analyse.py`); nothing writes it any more.
- `attach_statistics_session` already returns early on `statistics_session is None`.

Tests (`backend/statistics/tests/middleware_test.py`):

- An unknown `.json` path creates no `Session` and no `Visit`, and the response carries no
  `majora_statistics` cookie.
- The same request carrying the cookie of an existing session leaves that session's
  `last_seen_at`, IP and visits (count, hits, `last_path`) untouched, and sets no cookie.
- A resolved route returning 404 (e.g. an unknown game slug) is still tracked (out of scope,
  documents the boundary).
- Existing tests storing `first_path = 'unresolved'` are updated: such a request no longer
  creates a session (`route_pattern_test.py` keeps testing the helper itself).

## Files to Change

- `backend/statistics/middleware.py` — skip unresolved routes before any lookup.
- `backend/statistics/tests/middleware_test.py` — new and updated tests.

# Tracking race

Part of the [Statistics Dashboard](../statistics_dashboard.md) spec.

## Purpose

Visitor requests must never fail because Clear ([clear-endpoint.md](clear-endpoint.md)) deleted
their statistics session while the request was running. A request that loaded its session just
before or during a clear may then try to write or extend a `Visit`, or attach a user, for a
session that no longer exists.

## Contract

No new endpoint. These internal functions (in `backend/statistics/middleware.py`,
`visit_tracking.py` and `session_attachment.py`) must keep working when the session has
vanished:

- the statistics middleware's `_track_visit` / `visit_tracking.track_visit`
- the middleware's `_backfill_user` / `session_attachment.attach_user`

## Behaviour

- A foreign-key / integrity error (or a missing row) caused by a session deleted between being
  loaded and its visit being tracked, or between tracking and user attachment, is **caught**.
- Tracking (or user attachment) is skipped for that request, and the request is served normally:
  it **never returns a 500** because of this.
- The normal path is unchanged.
- **Old cookies:** after a clear, every visitor's cookie points to a deleted `Session`.
  `_session_from_cookie` (via `_load_or_create_session`) already returns `None` for an unknown
  token, so the next request just creates a new session. This is existing behaviour, now covered
  by a test.

## Permissions & caching

No change (middleware only; no endpoint, permission or cache rule is added).

## Edge cases

- **The Clear request counts itself:** right after a clear, the staff user who clicked it may
  end up with a fresh session and counts as 1 visitor on the next Reload. This is accepted;
  dashboard calls are not excluded from tracking.
- Requests carrying the statistics-skip header are untouched (they are never tracked).

## Tests

- Regression tests that delete the session at each point — between load and track, and between
  track and user attachment — and assert there is no exception and no 500.
- A stale-cookie test: a cookie pointing to a deleted session gets a new session.

## Open questions

None.

## Implemented by

#1683.

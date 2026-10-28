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

- the statistics middleware's `_touch_session` (refresh of a reused session's `last_seen_at`)
- the statistics middleware's `_track_visit` / `visit_tracking.track_visit`
- the middleware's `_backfill_user` / `session_attachment.attach_user`

## Behaviour

- The session can vanish between being loaded and being touched, between being loaded (or
  touched) and its visit being tracked, or between tracking and user attachment.
- **Touch:** a reused session's `last_seen_at` is refreshed with a filtered `UPDATE` (not
  `save(update_fields=...)`), so touching a deleted session matches no rows and is a no-op.
- **Track:** opening a `Visit` for a deleted session raises a foreign-key `IntegrityError`; the
  insert runs inside a savepoint and only that error is **caught**, so the enclosing transaction
  stays usable. Extending the latest visit is an `UPDATE` that just matches no rows.
- **User attachment:** already tolerates a deleted session — the in-place attach matches no rows
  and falls through to rotation, so a new `Session` tied to the user is created. No code change
  was needed; only tests were added.
- Tracking is skipped for that request (no visit is written, nothing is logged), and the request
  is served normally: it **never returns a 500** because of this.
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

- Regression tests that delete the session at each point — between load and touch, between load
  and track, and between track and user attachment — and assert there is no exception and no
  500.
- A stale-cookie test: a cookie pointing to a deleted session gets a new session.

## Open questions

None.

## Implemented by

#1683.

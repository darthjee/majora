# Write tracking-race.md

Create `docs/agents/specs/statistics_dashboard/tracking-race.md` using the common template.
Implemented by #1683.

- **Purpose:** visitor requests must never fail because Clear deleted their session
  mid-request.
- **Contract:** no new endpoint. These internal functions must keep working when the session
  has vanished:
  - `StatisticsSessionMiddleware._track_visit` / `visit_tracking.track_visit`
  - `_backfill_user` / `session_attachment.attach_user`
- **Behaviour:**
  - A foreign key / integrity error (or a missing row) caused by a session deleted between
    being loaded and its visit being tracked, or between tracking and user attachment, is
    caught.
  - Tracking is skipped for that request, and the request never returns a 500.
  - The normal path is unchanged.
  - Old cookies: `_session_from_cookie` already returns `None` for an unknown token, so a new
    session is created. That is existing behaviour, now covered by a test.
- **Permissions & caching:** not applicable (middleware). State "No change".
- **Edge cases:**
  - Right after a clear, the staff user who clicked it counts as 1 visitor (accepted, not
    excluded from tracking).
  - Requests with the statistics-skip header are untouched.
- **Tests:** regression tests that delete the session at each point (between load and track,
  between track and attach) and assert there is no exception or 500. Add a stale-cookie test.
- **Open questions:** none.
- **Implemented by:** #1683.

## Files to Change

- `docs/agents/specs/statistics_dashboard/tracking-race.md` — new topic page.

# Sync the tracking-race spec

Bring `docs/agents/specs/statistics_dashboard/tracking-race.md` in line with what was found and
built:

- **Contract:** add the middleware's `_touch_session` to the list of functions that must keep
  working when the session vanished.
- **Behaviour:** say the failure can also happen between load and touch; touching a deleted
  session is a no-op `UPDATE` (no `save(update_fields=...)`); user attachment already tolerates a
  deleted session by rotating to a new session tied to the user, so only tests were added.
- **Tests:** list "between load and touch" alongside the existing points.

Keep the file's existing structure and the `## Implemented by` line (#1683). Run markdownlint.

## Files to Change

- `docs/agents/specs/statistics_dashboard/tracking-race.md` — contract, behaviour and tests updated.

# Investigation plan and symptom pages

`investigation-plan.md`:

- The two angles: code review, and the scripts (`emulate.py` locally, `analyse.py` on production
  through the export endpoint).
- Sub-issue order and dependencies (specs and investigator agent → scope/endpoint backend →
  frontend → version bump → `emulate.py` → `analyse.py` → findings → fix issue); the version bump
  gates only the production run of `analyse.py`.
- Definition of done: every hypothesis confirmed or ruled out with evidence, root cause
  reproduced locally by an emulation scenario, findings written, fix issue created (with a
  regression test, a post-fix check, its own version bump and the cleanup).
- The request hot path (`StatisticsSessionMiddleware`) does not change in this Epic.

`symptom.md`:

- New `Session` (the suspected bug) vs. new `Visit` (expected after
  `MAJORA_STATISTICS_VISIT_INACTIVITY_SECONDS`, default 30 min). First task of the investigation:
  confirm the observed symptom is a new `Session` row.
- How reuse/creation works today: signed `majora_statistics` cookie → `Session` by token and
  domain; reused only when `session.ip` and `session.domain_id` match; otherwise a new row.
  After the view, `_backfill_user` attaches the user in place to a session created in this
  request, or always rotates a pre-existing anonymous session to a new `Session`.
- Legitimate new sessions (reported separately, not counted as the bug): other browser/device,
  private window, cleared cookies, logout (the view deletes the cookie), real IP change, bots that
  never keep cookies, cookies pointing to sessions removed by a statistics Clear (#1684).
- Link to `docs/agents/statistics.md` (*Login is a visit boundary*, *Tracking race*) as background.

## Files to Change

- `docs/agents/specs/statistics-bug/investigation-plan.md` — new.
- `docs/agents/specs/statistics-bug/symptom.md` — new.

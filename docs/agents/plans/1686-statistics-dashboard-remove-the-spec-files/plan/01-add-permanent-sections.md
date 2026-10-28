# Add the permanent sections to statistics.md

Read each spec page, check it against the merged code, and add the lasting content to
`docs/agents/statistics.md` as new sections. Match the doc's existing style. Keep each section
short, and point to `access-control/staff-statistics.md` for permissions.

Sections to add:

- **Staff dashboard card**: what the visits summary card on `/#/staff/dashboard` shows, the
  `day` / `week` / `month` rolling periods ending today, Reload, Clear behind the typed `CLEAR`
  confirmation, and the link to `/#/staff/statistics`. The feature is permanent. Name the
  frontend files (`VisitsSummaryCard.jsx`, `VisitsSummaryCardController.js`,
  `VisitsSummaryCardHelper.jsx`, `dashboardCardConfig.js`, `staffStatisticsConfig.js`).
- **Summary endpoint**: `GET staff/statistics/summary.json` (`staff_statistics_summary.py`).
  How it counts unique visitors, its `period` / `tz` params, and the response shape. Also add a
  row for it to the *API conventions* table if it fits there.
- **Clear**: `DELETE staff/statistics.json` (`staff_statistics_clear.py`) and
  `backend/statistics/reset.py`. Cover the batched, separately committed deletes, the ID reset
  (next rows start at id `1`), the MySQL-only SQL kept in `reset.py`, no rollback on failure,
  and the gunicorn-timeout caveat.
- **Audit log** (subsection of Clear, anchor `#audit-log`): the server-log-only
  `staff_statistics_clear` line. Cover its fields, its levels (INFO on success, WARNING on
  failure), what is not logged (IP, username, email, exception message) and why, and how partial
  counts are carried on failure. Check that last point against the `deleted_visits` /
  `deleted_sessions` tracking in `reset.py`.
- **Tracking race**: the middleware (`middleware.py`, `visit_tracking.py`,
  `session_attachment.py`) tolerates a session deleted mid-request. Cover the filtered `UPDATE`
  on touch, the savepoint plus caught `IntegrityError` on track, the fall-through to rotation on
  user attachment, and old cookies creating a new session.

Also update the doc's intro or *Overview* to mention the dashboard card, and its table of
contents if it has one.

## Files to Change

- `docs/agents/statistics.md`: new sections above.
- `docs/agents/index.md` / `docs/agents/summary.md`: update the statistics entry's one-line
  description only if it now undersells the doc.

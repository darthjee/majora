# Issue: Statistics dashboard: discuss and enhance specs for the clear audit log

## Description

Part of #1678 (Epic: staff dashboard visits summary card).

A discussion-only sub-issue that settles **the audit log for the statistics Clear action** and
records the result in `docs/agents/specs/statistics_dashboard/clear-endpoint.md`. It changes no
code; the logging itself is implemented by #1684.

## Problem

Clear is permanent and wipes all visit statistics in production, so every Clear must leave a
trace of who ran it, when, and how many rows it deleted. The current spec only says the audit
entry's shape is pending (#1681), leaving its destination, fields, levels, failure behaviour and
data sensitivity undefined.

## Expected Behavior

- `clear-endpoint.md` has an `### Audit log` section defining the destination, fields, format,
  levels and failure behaviour from *Solution*, precisely enough to implement in #1684.
- The audit-log open question is removed from `clear-endpoint.md` and the index.
- The *Tests* section of `clear-endpoint.md` lists the concrete `assertLogs` cases.

## Solution

### Destination

- **Server log only.** No new model or table, no migration, no admin page.
- The Clear view logs through `logging.getLogger(__name__)` inside `backend/staff/views/`, so the
  entry goes to the existing `staff` logger (configured in `backend/majora_project/settings.py`
  to write to stdout, which Render's log capture picks up). This follows the existing staff
  audit lines in `backend/staff/views/_api_token_shared.py` and `_recovery_token_shared.py`.
- Retention is whatever the Render log retention is; nothing is visible in the app.
- Rejected: a persisted `StatisticsClear` model (survives longer and could feed a "last cleared
  by" line on the card, but needs a migration, retention policy and access-control docs — too
  much for a pre-launch testing tool). A later issue can add it if needed.

### Fields and format

One `key=value` line per Clear run, in the same style as the existing staff audit lines, with a
fixed message key so it is easy to grep:

```
2026-10-27 14:02:11,512 INFO staff.views.staff_statistics_clear staff_statistics_clear status=success staff_id=7 deleted_visits=1234 deleted_sessions=321 duration_ms=842
```

| Field | Value |
|---|---|
| `status` | `success` or `failed`. |
| `staff_id` | `request.user.id` of the caller (same name as in the token audit lines). |
| `deleted_visits`, `deleted_sessions` | The same counts as the response; on failure, the rows deleted before the error. |
| `duration_ms` | Wall-clock time of the clear (deletes + ID reset), in milliseconds, so runs close to the 30s gunicorn timeout are visible. |
| `error` | Only when `status=failed`: the exception class name (e.g. `OperationalError`). |

- The timestamp comes from the log formatter's `asctime`; it is not a field.
- Not logged: username, email, the exception message (it may contain SQL), the batch count.
- The line is written by a small helper in the Clear view module (`backend/staff/views/staff_statistics_clear.py`, named like the other `staff_statistics_*` views),
  `log_statistics_clear(status, staff_id, deleted_visits, deleted_sessions, duration_ms, error=None)`,
  following `log_api_token_action` in `backend/staff/views/_api_token_shared.py`.

### Request IP

The request IP is deliberately **not** logged:

- No backend log line records an IP today (auth, email, API-token and recovery-token logs all
  log ids only); this would set a new precedent.
- The IP is personal data; logging it would keep visitor-adjacent data in Render's logs after a
  Clear whose purpose is to wipe that data.
- `staff_id` already identifies the account. Render's own request logs record the client IP of
  every HTTP request, so an investigation can correlate by timestamp without the app logging it.

### Partial failure

- **Every run is logged**, success or failure.
- Success: level **INFO**, `status=success`.
- Failure (database error, safety limit exceeded, …): level **WARNING**, `status=failed`, the
  counts deleted before the error, and `error=<exception class name>`. The exception is then
  re-raised, so the endpoint still returns `500` and nothing is rolled back.
- To log partial counts, `backend/statistics/reset.py` must make the running counts available
  when it fails (e.g. the raised error carries `deleted_visits` / `deleted_sessions`); the exact
  mechanism is left to the implementation (#1684).
- A run killed by the gunicorn timeout writes **no** line (the worker is killed before the view
  can log). The spec states this explicitly; the next Clear's line shows the remaining rows.

### When logging fails

No special handling. Python logging never raises into the caller (handler errors go through
`Handler.handleError`), so a logging failure cannot change the response or the clear.

### Where it goes in the spec

- Add an `### Audit log` section to `docs/agents/specs/statistics_dashboard/clear-endpoint.md`
  (no new file), containing the decisions above.
- Replace the "pending" / "see *Open questions*" wording in its *Contract*, *Behaviour* and
  *Edge cases* sections with links to that section.
- Remove the "Audit log … → #1681" open question from `clear-endpoint.md` and from the index
  `docs/agents/specs/statistics_dashboard.md`.
- Turn the "audit log entry is written" test into concrete cases using
  `assertLogs('staff', level=...)`: an INFO `status=success` line with the counts and
  `staff_id` on success, and a WARNING `status=failed` line with partial counts and `error=` when
  the safety limit is exceeded.

### Security review

The line contains no secrets, no tokens, no IP and no exception message — only the staff id,
row counts, duration, status and an exception class name. No extra protection is needed beyond
the existing access to Render's logs.

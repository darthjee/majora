# Issue: Statistics dashboard: clear statistics endpoint with ID reset

## Description

Part of #1678 (Epic: staff dashboard visits summary card).

Add the staff backend endpoint that **clears all visit statistics** (every `statistics.Visit`
and `statistics.Session` row) and resets their auto-increment IDs. The detailed reference is
`docs/agents/specs/statistics_dashboard/clear-endpoint.md`, which includes the batched clear and
the audit log settled in #1680 and #1681. This is a permanent feature with no environment gate.
The dependencies #1680, #1681 and #1683 are merged.

## Problem

The site is not live yet, and staff are still testing and fixing the statistics tracking. The
data recorded so far is noise, and there is no way to wipe it from the app. A plain ORM delete
does not work here, for three reasons:

- Django runs the `Visit.session` cascade in Python, loading every visit first.
- `TRUNCATE` fails on the foreign key.
- Production gunicorn workers are killed after 30s.

## Expected Behavior

- `DELETE staff/statistics.json`, routed in `backend/staff/urls.py` next to the other
  `staff/statistics/*.json` routes. The request has no body.
- `200 {"deleted_visits": <n>, "deleted_sessions": <n>}`, sent once the deletes and the ID
  reset have finished. An empty dataset returns zero counts.
- `401` for anonymous callers, `403 {"errors": {"detail": ["not_allowed"]}}` for non-staff,
  `405` for any other method, and `500` on failure (including the safety limit).
- After a clear, the next visit and session rows get id `1`.
- Every run writes one audit line to the server log.

> This replaces the "returns `204`" wording in the earlier body.

### Edge cases

Follow the spec:

- An empty dataset returns zero counts.
- Concurrent clears are allowed with no lock; each response counts only its own deletes.
- A visit added to an old session after the visits pass is removed by the sessions pass.
- A partial failure or a gunicorn timeout is fixed by clicking Clear again; nothing is rolled
  back.
- The counts include the Clear request's own visit and session.
- Ids are reused after a clear.

### Acceptance criteria

Tests use `TransactionTestCase` (the reset cannot run inside a transaction):

- Every visit and session is deleted, and a row created afterwards gets id `1`.
- Response counts are correct, including the empty-dataset case.
- `401`, `403` and `405` are returned where expected.
- With the batch size patched to `2`, the deletes run in several batches and remove every row.
- A `mock.patch` side effect inserts a visit between the passes. The sessions pass deletes it,
  and the session delete does not fail on the foreign key.
- With the batch limit patched low, the endpoint returns `500` and logs one WARNING
  `status=failed` line with the partial counts and `error=`
  (`assertLogs('staff', level='WARNING')`).
- A successful clear logs one INFO `status=success` line with the counts and `staff_id`
  (`assertLogs('staff', level='INFO')`).

The security, data-access and cache agents review the change.

## Solution

### `backend/statistics/reset.py`

All MySQL-specific SQL lives in this one helper.

1. **Visits pass:** `DELETE FROM statistics_visit ORDER BY id LIMIT <batch>` in a loop until a
   batch deletes 0 rows.
2. **Sessions pass:** select up to `<batch>` session ids ordered by id. Delete their visits
   (`WHERE session_id IN (…)`) first, then the sessions. Stop when a batch finds no sessions.
3. **ID reset:** `ALTER TABLE … AUTO_INCREMENT = 1` on both tables.

Rules for these passes:

- Don't use `TRUNCATE` (InnoDB refuses because of the foreign key), don't turn off
  `FOREIGN_KEY_CHECKS`, and don't use `atomic()`. Each batch autocommits, and `ALTER TABLE`
  commits implicitly anyway.
- Batch size: `Settings.clear_batch_size()` in `backend/statistics/settings.py`, read from
  `MAJORA_STATISTICS_CLEAR_BATCH_SIZE` with the `env_int` helper. The default is `10000`.
- Safety limit: each loop runs at most `1000` batches. Going over raises
  `StatisticsResetLimitExceeded`.
- **Partial counts:** the reset is a small `StatisticsReset` object. Its `deleted_visits` and
  `deleted_sessions` attributes grow as each batch commits; visits deleted in the sessions pass
  also count towards `deleted_visits`. The view keeps a reference to the object, so when a run
  fails it can still read the counts reached before the error. There is no wrapping exception,
  so the original exception class stays visible.

### View and audit log

- Put the view in `backend/staff/views/staff_statistics_clear.py`, with `@restricted`,
  `@api_view(['DELETE'])`, `@permission_classes([AllowAny])` and `require_staff` inline, like
  `backend/staff/views/staff_cache_clear.py`.
- `log_statistics_clear(status, staff_id, deleted_visits, deleted_sessions, duration_ms, error=None)`
  in the view module, following `log_api_token_action`. It writes one
  `staff_statistics_clear key=value` line to the `staff` logger:
  - On success it logs at **INFO** with `status=success`.
  - On failure it logs at **WARNING** with `status=failed`, the partial counts and
    `error=type(exc).__name__`, then re-raises, so the endpoint returns `500`.
- The line never includes the IP, username, email or exception message.

### Docs

Update `docs/agents/access-control/staff-statistics.md`. It currently says every staff
statistics endpoint is GET-only and that no role can write; add the staff-only Clear action.

### Scope

- **In scope:** `reset.py`, `Settings.clear_batch_size()`, the view, the route, the tests, and
  the access-control doc update.
- **Out of scope:**
  - the frontend card (#1685);
  - proxy or navi changes (the endpoint is proxied through Tent but not cached and not warmed);
  - a persisted audit model;
  - rate limiting;
  - removing the specs (#1686).

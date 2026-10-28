# Clear endpoint

Part of the [Statistics Dashboard](../statistics_dashboard.md) spec.

## Purpose

A **permanent** staff action that wipes all visit statistics (every `statistics.Visit` and
`statistics.Session` row) and resets their auto-increment IDs, so the first rows recorded after a
clear get id `1` again. It is called by the dashboard card's Clear button
([dashboard-card.md](dashboard-card.md)) after a typed confirmation.

## Contract

`DELETE staff/statistics.json`

The route goes in `backend/staff/urls.py`, next to the other `staff/statistics/*.json` routes.
The request has no body.

**Responses**

- `200` with the deleted row counts:

  ```json
  { "deleted_visits": 1234, "deleted_sessions": 321 }
  ```

  The same counts are recorded in the [audit log](#audit-log). The card can show them in its
  success status.
- An already-empty dataset returns `200 {"deleted_visits": 0, "deleted_sessions": 0}`.
- `401` for anonymous callers and `403 {"errors": {"detail": ["not_allowed"]}}` for non-staff.
- `405` for any method other than `DELETE`.

The response is sent only after the deletes and the ID reset have finished.

> This supersedes the "returns `204`" wording in the original body of #1684: the endpoint
> returns `200` with the deleted counts.

## Behaviour

- **Encapsulation:** all MySQL-specific SQL lives in one helper, `backend/statistics/reset.py`,
  which the view calls. It is not spread across views.
- **Deletes:** delete all `statistics_visit` rows first, then all `statistics_session` rows
  (child before parent), using **batched deletes** (see [Batched clear](#batched-clear)).
- **ID reset:** then run `ALTER TABLE … AUTO_INCREMENT = 1` on both tables. On an empty table
  InnoDB starts the counter at `1`, and MySQL 8 keeps it across restarts.
- **Why not `TRUNCATE`:** InnoDB refuses to truncate `statistics_session` because
  `statistics_visit` has a foreign key to it, even when that table is empty. Getting around that
  would mean turning off `FOREIGN_KEY_CHECKS`, which is not allowed.
- **Rows inserted before the `ALTER`:** if live tracking inserts a row between the deletes and
  the `ALTER`, InnoDB sets the counter to the highest id + 1 instead of `1`. That is harmless.
- **Transactions:** `ALTER TABLE` commits any open transaction implicitly, so the reset cannot
  run inside `atomic()`.
- **Self-count:** the deleted counts include the Clear request's own visit and session (the
  middleware tracks the request before the view runs).
- **Audit log:** every Clear, successful or not, writes one audit line (see [Audit log](#audit-log)).
- **ID reuse:** visit / session ids are reused after a clear. That is acceptable because the
  staff statistics endpoints are not cached.

### Batched clear

Two constraints in the code shape the algorithm:

- `Visit.session` is `on_delete=CASCADE`, but Django runs that cascade itself, in Python. An ORM
  `Session.objects.filter(...).delete()` loads every related visit first, and a raw delete of a
  session that still has visits fails on the foreign key.
- Production runs gunicorn with 4 workers and the default 30s timeout
  (`backend/bin/server.sh`). A request that runs longer has its worker killed partway through.

**Algorithm** (all of it in `backend/statistics/reset.py`):

1. **Visits pass:** run `DELETE FROM statistics_visit ORDER BY id LIMIT <batch>` in a loop until
   a batch deletes 0 rows. Raw SQL skips Django's Python-side cascade collector and needs no list
   of pks first.
2. **Sessions pass:** in a loop, select up to `<batch>` session ids, ordered by id. For each
   batch, first run `DELETE FROM statistics_visit WHERE session_id IN (…)`, then delete the
   sessions themselves. The loop stops when a batch finds no sessions. This covers a visit that a
   live request adds to an old session after the visits pass has finished, so the session delete
   never fails on the foreign key.
3. **ID reset:** `ALTER TABLE … AUTO_INCREMENT = 1` on both tables, as described above.
4. **Response counts:** `deleted_visits` and `deleted_sessions` are the sums of the rows the
   passes deleted. Visits deleted in the sessions pass count towards `deleted_visits`.

**Rules:**

- **Commits:** each batch commits on its own (autocommit, no `atomic()`), so locks are held only
  for one batch and live tracking is not blocked.
- **Batch size:** a new setting in `backend/statistics/settings.py`,
  `Settings.clear_batch_size()`, read from the env var `MAJORA_STATISTICS_CLEAR_BATCH_SIZE` with
  a default of `10000`, following the existing `env_int` settings. Tests lower it (e.g. to `2`)
  to force several batches.
- **Safety limit:** each loop stops after at most `1000` batches. Going over it raises an error,
  and the endpoint returns `500`.
- **Synchronous:** Clear runs within the HTTP request; there is no background job. If it hits the
  gunicorn timeout it stops partway, and clicking Clear again finishes the job.
- **MySQL-specific SQL:** `DELETE … ORDER BY … LIMIT` is MySQL-only. That is acceptable because
  all MySQL-specific SQL stays in `reset.py`, and the test database is MySQL too.

### Audit log

Clear is permanent and wipes production data, so every run leaves a trace of who ran it, when,
and how many rows it deleted.

**Destination**

- **Server log only.** There is no model, table, migration or admin page.
- The Clear view (`backend/staff/views/staff_statistics_clear.py`) logs with
  `logging.getLogger(__name__)`, so the line goes to the existing `staff` logger. That logger is
  configured in `backend/majora_project/settings.py` to write to stdout, which Render captures.
  This follows the existing staff audit lines in `backend/staff/views/_api_token_shared.py` and
  `_recovery_token_shared.py`.
- Retention is Render's log retention; nothing is shown in the app.
- A persisted `StatisticsClear` model was rejected: it would need a migration, a retention policy
  and access-control docs, which is too much for this tool. A later issue can add it if needed.

**Format**

One `key=value` line per run, in the same style as the other staff audit lines, with the fixed
message key `staff_statistics_clear` so it is easy to grep:

```text
2026-10-27 14:02:11,512 INFO staff.views.staff_statistics_clear staff_statistics_clear status=success staff_id=7 deleted_visits=1234 deleted_sessions=321 duration_ms=842
```

| Field | Value |
|---|---|
| `status` | `success` or `failed`. |
| `staff_id` | `request.user.id` of the caller (same name as in the API-token audit lines). |
| `deleted_visits`, `deleted_sessions` | The same counts as the response; on failure, the rows deleted before the error. |
| `duration_ms` | Wall-clock time of the clear (deletes + ID reset), in milliseconds, so runs close to the 30s gunicorn timeout are visible. |
| `error` | Only when `status=failed`: the exception class name (e.g. `OperationalError`). |

The timestamp comes from the log formatter's `asctime`; it is not a field.

**Not logged:** the request IP, the username, the email, the exception message (it may contain
SQL) and the batch count. The IP is left out on purpose:

- no backend log line records an IP today, so this would set a new precedent;
- the IP is personal data, and logging it would keep visitor-adjacent data in the logs after a
  Clear whose purpose is to wipe that data;
- `staff_id` already identifies the account, and Render's own request logs record the client IP,
  so an investigation can correlate by timestamp.

**Helper**

The line is written by a small helper in the view module,
`log_statistics_clear(status, staff_id, deleted_visits, deleted_sessions, duration_ms, error=None)`,
following `log_api_token_action` in `backend/staff/views/_api_token_shared.py`.

**Levels and failures**

- **Every run is logged**, success or failure.
- Success logs at **INFO** with `status=success`.
- A failure (database error, safety limit exceeded, …) logs at **WARNING** with `status=failed`,
  the counts deleted before the error and `error=<exception class name>`. The exception is then
  re-raised, so the endpoint still returns `500` and nothing is rolled back.
- To log partial counts, `backend/statistics/reset.py` must make the running counts available
  when it fails (e.g. the raised error carries `deleted_visits` / `deleted_sessions`). #1684
  picks the exact mechanism.
- A run killed by the gunicorn timeout writes **no** line, because the worker is killed before
  the view can log. The next Clear's line shows the rows that were left.
- **Logging failures** need no special handling: Python logging never raises into the caller
  (handler errors go through `Handler.handleError`), so a logging failure cannot change the
  response or the clear.

**Security:** the line holds only the staff id, the row counts, the duration, the status and an
exception class name — no secrets, tokens, IP or exception message. It needs no protection
beyond the existing access to Render's logs.

## Permissions & caching

- **Who:** staff or superuser only. There is no separate, stricter rule for Clear.
- **Server side:** the view calls `require_staff` inline under `@permission_classes([AllowAny])`
  (401 for anonymous, 403 `not_allowed` for non-staff), like
  `backend/staff/views/staff_cache_clear.py`, and is decorated with `@restricted`, so the
  response carries `X-Skip-Cache`.
- **Tent / navi:** proxied through Tent but **not cached**; **not** added to the navi cache
  warmer. No new proxy handler is needed. The `cache` agent verifies this during review.
- **API tokens:** scoped API tokens cannot call `staff/` routes (`staff/` is in
  `EXCLUDED_ROUTE_PREFIXES` in `backend/accounts/authentication.py`), so no `@token_scopes`
  declaration is needed.
- **Authentication:** the standard token / cookie-token authentication; `DELETE` sends no body.
- **No rate limiting and no environment gate:** Clear is staff-only, needs the typed
  confirmation and is audited; concurrent clears are safe (see *Edge cases*).
- **Data exposure:** the response returns only row counts. The `data-access` and `security`
  agents confirm this during review.
- **Docs:** #1684 updates `docs/agents/access-control/staff-statistics.md`, which currently
  describes the staff statistics endpoints as read-only.

## Edge cases

- **Empty dataset:** `200` with zero counts.
- **Concurrent clears** (two staff users clicking Clear at the same time): allowed, with no
  lock. The deletes are idempotent, and each response counts only the rows that request
  deleted.
- **Failure partway through** (the batched deletes leave some rows, e.g. the safety limit, a
  database error or the gunicorn timeout): the endpoint returns `500` and nothing is rolled back.
  Rows already deleted stay deleted, and a retry finishes the rest. The card fetches the count
  again after any failure (see [dashboard-card.md](dashboard-card.md)). A partial run is logged
  at WARNING with the partial counts (see [Audit log](#audit-log)); a run killed by the gunicorn
  timeout writes no line.
- **Old cookies and requests in flight** during the clear: see
  [tracking-race.md](tracking-race.md).

## Tests

Backend tests use `TransactionTestCase` (not the usual `TestCase`), because the reset cannot run
inside a transaction. They cover:

- every `Visit` and `Session` row is deleted, and the next rows start again at id `1`;
- the counts in the response, including the empty-dataset case;
- `401`, `403` and `405`;
- with a small batch size (e.g. `2`), the deletes run in several batches and every row is
  removed;
- a visit attached to a session after the visits pass is deleted by the sessions pass, and the
  session delete does not fail on the foreign key;
- going over the safety limit returns `500`;
- a successful clear writes one INFO `status=success` line with the counts and `staff_id`, checked
  with `assertLogs('staff', level='INFO')` (see [Audit log](#audit-log));
- going over the safety limit writes one WARNING `status=failed` line with the partial counts and
  `error=`, checked with `assertLogs('staff', level='WARNING')`.

## Open questions

None. See the index's [Open questions](../statistics_dashboard.md#open-questions).

## Implemented by

#1684. It depends on #1680, #1681 and #1683.

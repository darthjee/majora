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

  The same counts are recorded in the audit log (see *Open questions*). The card can show them
  in its success status.
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
  (child before parent), using **batched deletes**. The batching details are pending (see *Open
  questions*).
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
- **Audit log:** every Clear writes an audit entry; its shape is pending (see *Open questions*).
- **ID reuse:** visit / session ids are reused after a clear. That is acceptable because the
  staff statistics endpoints are not cached.

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
  confirmation and is audited; concurrency is handled by #1680.
- **Data exposure:** the response returns only row counts. The `data-access` and `security`
  agents confirm this during review.
- **Docs:** #1684 updates `docs/agents/access-control/staff-statistics.md`, which currently
  describes the staff statistics endpoints as read-only.

## Edge cases

- **Empty dataset:** `200` with zero counts.
- **Concurrent clears** (two staff users clicking Clear at the same time): pending → #1680.
- **Failure partway through** (the batched deletes leave some rows): pending → #1680. The card
  fetches the count again after any failure (see [dashboard-card.md](dashboard-card.md)).
- **Old cookies and requests in flight** during the clear: see
  [tracking-race.md](tracking-race.md).

## Tests

Backend tests use `TransactionTestCase` (not the usual `TestCase`), because the reset cannot run
inside a transaction. They cover:

- every `Visit` and `Session` row is deleted, and the next rows start again at id `1`;
- the counts in the response, including the empty-dataset case;
- `401`, `403` and `405`;
- the audit log entry is written (its shape → #1681).

## Open questions

See the index's [Open questions](../statistics_dashboard.md#open-questions).

- Batch size, delete order and per-batch commits, locking, the `AUTO_INCREMENT` reset step,
  request duration, concurrent clears and partial-failure behaviour → #1680.
- Audit log fields, level, destination and persistence → #1681.

## Implemented by

#1684. It depends on #1680, #1681 and #1683.

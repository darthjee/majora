# Write clear-endpoint.md

Create `docs/agents/specs/statistics_dashboard/clear-endpoint.md` using the common template.
Implemented by #1684.

- **Purpose:** a permanent staff action that wipes all visit statistics and resets their IDs.
- **Contract:** `DELETE staff/statistics.json`.
  - `200 {"deleted_visits": <int>, "deleted_sessions": <int>}`. Include the issue's example.
  - `401` / `403` (`require_staff`); other methods return `405`. There is no request body.
  - An already-empty dataset returns `200` with zeros.
  - The response is sent only after the deletes and the reset have finished.
  - State that this supersedes the "204" wording in #1684's original body.
- **Behaviour:**
  - A helper, `backend/statistics/reset.py`, holds all the MySQL-specific SQL.
  - It deletes the `statistics_visit` rows first, then the `statistics_session` rows, in
    batches (details pending → #1680).
  - It then runs `ALTER TABLE … AUTO_INCREMENT = 1` on both tables, so the next rows get id 1.
    MySQL 8 keeps the counter across restarts.
  - Why not `TRUNCATE`: InnoDB refuses because of the foreign key, and turning off
    `FOREIGN_KEY_CHECKS` is not allowed.
  - Rows inserted before the `ALTER` make InnoDB set the counter to max + 1, which is harmless.
  - It cannot run inside `atomic()`, because `ALTER TABLE` commits implicitly.
  - The deleted counts include the Clear request's own visit and session.
  - Audit log entry → #1681.
- **Permissions & caching:**
  - `require_staff` inline, staff or superuser, and `@restricted`.
  - Proxied through Tent but not cached, and not in navi.
  - No `@token_scopes` declaration (`staff/` is excluded).
  - No rate limiting and no environment gate.
  - The response returns only counts.
  - #1684 updates `access-control/staff-statistics.md`, which is no longer read-only.
- **Edge cases:**
  - An empty dataset.
  - Concurrent clears → #1680.
  - A partial failure → #1680.
  - Old cookies and in-flight requests → see `tracking-race.md`.
- **Tests:** `TransactionTestCase`:
  - every row is deleted, and new rows start at id 1;
  - the counts in the response;
  - 401 / 403 / 405;
  - the audit log is written (shape → #1681).
- **Open questions:** batching, concurrency and partial failure → #1680; audit log → #1681.
- **Implemented by:** #1684. It depends on #1680, #1681 and #1683.

## Files to Change

- `docs/agents/specs/statistics_dashboard/clear-endpoint.md` — new topic page.

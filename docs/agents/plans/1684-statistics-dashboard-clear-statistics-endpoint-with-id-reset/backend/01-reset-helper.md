# Batch-size setting and the reset helper

Add `Settings.clear_batch_size()` to `backend/statistics/settings.py`. It reads
`env_int('MAJORA_STATISTICS_CLEAR_BATCH_SIZE', 10000)`, with a docstring like the other
settings.

Create `backend/statistics/reset.py` with:

- `MAX_BATCHES = 1000`, a module constant so tests can patch it.
- `class StatisticsResetLimitExceeded(Exception)`, raised when a loop goes over `MAX_BATCHES`.
- `class StatisticsReset`:
  - `__init__(self, batch_size=None)` defaults to `Settings.clear_batch_size()` and sets
    `deleted_visits = 0` and `deleted_sessions = 0`.
  - `run(self)` runs the passes below in order and returns `self`. Between batches it updates
    the counters (from `cursor.rowcount`) right after each statement, so a failure partway
    through leaves the counts reached so far on the object.
  - `_delete_visits()` (visits pass): loop
    `DELETE FROM <visit table> ORDER BY id LIMIT %s` until `rowcount == 0`.
  - `_delete_sessions()` (sessions pass): loop. Each batch selects up to `batch_size` session
    ids ordered by id, and stops when there are none. For each batch it runs
    `DELETE FROM <visit table> WHERE session_id IN (…)` (these rows add to `deleted_visits`),
    then `DELETE FROM <session table> WHERE id IN (…)` (these add to `deleted_sessions`). Use
    parameter placeholders, never string-formatted ids.
  - `_reset_ids()`: `ALTER TABLE <visit table> AUTO_INCREMENT = 1`, then the same for the
    session table.
  - A shared `_loop(batch_fn)` helper calls `batch_fn` until it reports 0 rows. It raises
    `StatisticsResetLimitExceeded` once more than `MAX_BATCHES` batches have run.
- Use `django.db.connection.cursor()` and table names from `Model._meta.db_table`, quoted with
  `connection.ops.quote_name`. No `transaction.atomic()`.

Keep the module docstring short and say why the SQL is raw: it avoids Django's Python-side
cascade, `TRUNCATE` is refused because of the foreign key, and `ALTER TABLE` commits
implicitly.

## Files to Change

- `backend/statistics/settings.py`: add `clear_batch_size()`.
- `backend/statistics/reset.py`: new; holds `StatisticsReset`, `StatisticsResetLimitExceeded`
  and `MAX_BATCHES`.

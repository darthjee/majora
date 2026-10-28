# Tests

Every test that runs the reset uses `@pytest.mark.django_db(transaction=True)`. The ID-reset
`ALTER TABLE` commits implicitly, so it cannot run inside the default test transaction. Build
rows with the existing statistics factories or with `Session.objects.create` /
`Visit.objects.create`.

**`backend/statistics/tests/reset_test.py`**

- With several sessions and visits, `run()` deletes every row, and the counts match.
- After `run()`, a newly created `Session` and `Visit` each get `id == 1`.
- Empty tables: the counts are `0` and nothing fails.
- With `batch_size=2` and more than 2 rows in each table, every row is still removed (several
  batches ran).
- A visit attached to an old session after the visits pass: patch `_delete_visits` with a
  wrapper that runs the real pass, then creates a `Visit` on a surviving session. Check that the
  sessions pass deletes it, that `deleted_visits` includes it, and that no `IntegrityError` is
  raised.
- With `MAX_BATCHES` patched to `1` and `batch_size=1` (more than one row), `run()` raises
  `StatisticsResetLimitExceeded`, and the object keeps the partial counts (> 0).

**`backend/statistics/tests/settings_test.py`**

- `clear_batch_size()`: the default is `10000`, the env value is read, and an invalid value
  falls back to the default, following the existing classes.

**`backend/staff/tests/staff_statistics_clear_test.py`**

Follow `staff_cache_clear_test.py`:

- `401` for anonymous callers, `403` for non-staff, `200` for staff and for superusers.
- `405` for `GET` (and `POST`) on `staff/statistics.json`.
- The response body has the deleted counts, which include the request's own visit and session
  (the middleware tracks the request before the view runs). An already-empty dataset (apart from
  the request's own rows) is covered by the reset tests.
- The response carries `X-Skip-Cache`.
- A successful clear logs one INFO `staff_statistics_clear status=success` line with
  `staff_id=<id>` and the counts (`caplog` or `assertLogs` on the `staff` logger, at INFO).
- With `MAX_BATCHES` and the batch size patched low, the response is `500`, and one WARNING
  `status=failed` line has the partial counts and `error=StatisticsResetLimitExceeded`. Use a
  client with `raise_request_exception=False`, or assert on the raised exception, depending on
  how DRF surfaces it.

## Files to Change

- `backend/statistics/tests/reset_test.py`: new.
- `backend/statistics/tests/settings_test.py`: add `clear_batch_size()` tests.
- `backend/staff/tests/staff_statistics_clear_test.py`: new.

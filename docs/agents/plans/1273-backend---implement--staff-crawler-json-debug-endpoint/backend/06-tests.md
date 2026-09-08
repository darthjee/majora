# Tests

Follow `backend/staff/tests/staff_cache_summary_test.py`/`staff_cache_clear_test.py` for
the staff-only-access test shape (unauthenticated → 401, authenticated non-staff → 403,
staff/superuser → success), applied to both `POST` and `GET`.

Cover:

- **Create**: valid `source`+`type`(+`payload`) creates a row and returns it; missing/
  empty `source` or `type` → `400`.
- **Cursor pagination**: `last_id` absent (returns from the start, oldest-first, capped to
  `PAGE_SIZE`), present with a valid mid-window id (returns only newer rows), malformed
  (non-integer) → `400`, valid-but-evicted/nonexistent → `[]`.
- **Retention eviction**: inserting beyond `RETENTION_CAP` deletes the oldest rows so the
  table never exceeds the cap.
- **Staff-only access**: both `POST` and `GET` reject unauthenticated/non-staff callers
  and set `X-Skip-Cache: true` on every response (success and error alike, per
  `@restricted`).

## Files to Change

- `backend/staff/tests/models/crawler_debug_emission_test.py` — new (model-level:
  required-field validation, ordering)
- `backend/staff/tests/crawler_debug_emission_paginator_test.py` — new (paginator +
  retention-cap unit tests, independent of the view)
- `backend/staff/tests/staff_crawler_test.py` — new (endpoint-level: create, list,
  cursor edge cases, staff-only access, `X-Skip-Cache` header)

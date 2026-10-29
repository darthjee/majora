# Visit list payload

Add the tracking fields to `GET staff/statistics/visit-list.json`, flat like `session_id`.

- `StaffStatisticsVisitSerializer`: append to `Meta.fields` the visit's `first_path` and
  `last_path` (model fields) and the session's, declared like `ip`:
  - `session_first_path = serializers.CharField(source='session.first_path', read_only=True, allow_null=True)`;
  - `session_creation_reason = serializers.CharField(source='session.creation_reason', read_only=True, allow_null=True)`;
  - `session_first_seen_logged = serializers.BooleanField(source='session.first_seen_logged', read_only=True, allow_null=True)`.
- `null` must stay `null` (check DRF's output for `allow_null` read-only fields; a nullable
  `BooleanField` must not turn `None` into `false`).
- No change to `VisitList` (the session is already joined), filters or sort keys.
- Update the class docstring.

Tests (`backend/staff/tests/staff_statistics_visit_list_test.py`):

- extend `ROW_KEYS` and the full `test_row` assertion with fixture values;
- a legacy visit/session returns `null` for all five fields (including `session_first_seen_logged`);
- `creation_reason` raw value returned;
- `test_token_never_appears` and `test_query_count_is_independent_of_rows` stay green.

## Files to Change

- `backend/staff/serializers/staff_statistics_visit.py` — five new fields
- `backend/staff/tests/staff_statistics_visit_list_test.py` — keys, values, `null`

# Export payload

Add the tracking fields to `GET staff/statistics/export.json`.

- `StaffStatisticsExportSessionSerializer.Meta.fields`: append `first_path`,
  `first_seen_logged`, `creation_reason` (plain model fields, read straight from the row;
  `creation_reason` is the raw stored value).
- `StaffStatisticsExportVisitSerializer.Meta.fields`: append `first_path`, `last_path`.
- Update the class docstrings to mention the tracking fields (route patterns, never raw paths).

Tests (`backend/staff/tests/staff_statistics_export_test.py`, helpers in
`statistics_export_support.py`):

- extend `SESSION_KEYS` / `VISIT_KEYS` and the full `test_row` assertion with values set on the
  fixtures (e.g. `first_path='games/<slug:game_slug>.json'`, `creation_reason='ip_changed'`,
  `first_seen_logged=True`, visit paths);
- a legacy row (columns left `NULL`) returns `null` for every new field;
- every `Session.CreationReason` value is returned raw (parametrized);
- `test_no_token_or_user_data` and `test_query_count_independent_of_page_size` stay unchanged
  and green.

## Files to Change

- `backend/staff/serializers/staff_statistics_export_session.py` — new session fields
- `backend/staff/serializers/staff_statistics_export_visit.py` — new visit fields
- `backend/staff/tests/staff_statistics_export_test.py` — keys, values, `null`, raw reasons
- `backend/staff/tests/statistics_export_support.py` — fixture values for the new columns, if needed

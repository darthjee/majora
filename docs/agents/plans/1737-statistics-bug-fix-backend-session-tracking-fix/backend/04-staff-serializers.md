# Staff visit list and export return the visit IPs

`session.ip` is now the last seen IP, so showing it on every visit row would show the newest IP
on old visits.

- `StaffStatisticsVisitSerializer` (`staff/statistics/visits.json`): add `first_ip` and
  `last_ip` (string or `null`). Keep `ip` for the current frontend until #1745 switches to the
  new fields: its value becomes the visit's `last_ip`, falling back to `session.ip` when the
  visit predates the migration (`NULL`). Update the docstring.
- `StaffStatisticsExportVisitSerializer` (`staff/statistics/export.json`): add `first_ip` and
  `last_ip` to each exported visit. The session's `ip` stays (last seen IP).
- No change to permissions: both endpoints stay staff-only (export also `statistics:read`).
  Never expose the session token.
- Check the visit list query still uses `select_related('session')` (no N+1 for the fallback).

Tests (`backend/staff/tests/`): visit rows and exported visits carry `first_ip` / `last_ip`;
`ip` equals `last_ip`, or `session.ip` when the visit columns are `NULL`.

`data-access` reviews the field change.

## Files to Change

- `backend/staff/serializers/staff_statistics_visit.py` — `first_ip`, `last_ip`, `ip` fallback.
- `backend/staff/serializers/staff_statistics_export_visit.py` — `first_ip`, `last_ip`.
- `backend/staff/tests/` (visit list and export tests) — tests.

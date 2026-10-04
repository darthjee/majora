# Add the overview.json view and URL

Add `staff_statistics_overview`, a copy of the `staff_statistics_visits` shape:
`@restricted`, `@api_view(['GET'])`, `@permission_classes([AllowAny])` (with the same
comment), then `require_staff(request)`, `parse_statistics_filters(request)`, and
`Response(statistics_envelope(filters, totals=OverviewTotals(filters).build()))`.
Register it in `staff/views/__init__.py` (import + `__all__`) and add the
`staff/statistics/overview.json` path named `staff-statistics-overview` after the visits
route in `staff/urls.py`.

View tests (mirror `staff_statistics_visits_test.py`): 401 anonymous, 403 non-staff (e.g. a
plain user / DM), 200 for staff and superuser, `X-Skip-Cache: true` header, 400 with the
shared error codes on invalid params, response keys are exactly `filters` + `totals` (no
`buckets`), `totals` keys and types, and `granularity=month` echoed in `filters` while the
totals are unchanged.

## Files to Change
- `backend/staff/views/staff_statistics_overview.py` — new view.
- `backend/staff/views/__init__.py` — export the view.
- `backend/staff/urls.py` — add the `staff-statistics-overview` route.
- `backend/staff/tests/staff_statistics_overview_test.py` — new view tests.

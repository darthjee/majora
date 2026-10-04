# Add visitors.json endpoint
Create `backend/staff/views/staff_statistics_visitors.py` with `staff_statistics_visitors(request)`, mirroring `staff_statistics_visits.py` exactly:
- Decorators, in order: `@restricted`, `@api_view(['GET'])`, the AllowAny comment, then `@permission_classes([AllowAny])`.
- Run `require_staff` first, then `parse_statistics_filters`.
- Then `VisitorsSeries(filters).build()` and `Response(statistics_envelope(filters, buckets, totals))`.

Register it in `backend/staff/urls.py` as `path('staff/statistics/visitors.json', views.staff_statistics_visitors, name='staff-statistics-visitors')`. Export it from `backend/staff/views/__init__.py`: the import after `_visits`, and `'staff_statistics_visitors'` in `__all__`.

Tests in `backend/staff/tests/staff_statistics_visitors_test.py`, mirroring `staff_statistics_visits_test.py`:
- 401 anonymous; 403 non-staff and DM.
- Auth runs before param validation.
- 200 staff / superuser.
- 400 `{'errors': {...}}` on invalid params.
- Full envelope equality, with bucket keys `start, end, unique_visitors, new_visitors, returning_visitors, anonymous, logged_in` and totals keys.
- `audience=logged_in` keeps the `anonymous` key at 0.
- `X-Skip-Cache == 'true'`.
- POST returns 405.
- `reverse('staff-statistics-visitors')` resolves.

## Files to Change
- `backend/staff/views/staff_statistics_visitors.py`: new view.
- `backend/staff/views/__init__.py`: export.
- `backend/staff/urls.py`: URL.
- `backend/staff/tests/staff_statistics_visitors_test.py`: new tests.

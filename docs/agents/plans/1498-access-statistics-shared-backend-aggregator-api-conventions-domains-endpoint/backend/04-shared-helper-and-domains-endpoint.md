# Shared view helper and domains endpoint

Add the shared staff view helper and the domain filter endpoint, per the spec's "API
conventions" section.

- `backend/staff/views/_staff_statistics_shared.py`:
  - `parse_statistics_filters(request)` wraps `StatisticsParamsParser(request.query_params)` and
    returns `(filters, None)` or `(None, Response({'errors': errors}, status=400))`.
  - `statistics_envelope(filters, buckets=None, totals=None, **extra)` (or an equivalent small
    builder) returns `{'filters': filters.as_dict(), ...}`, so tab endpoints only add their
    payload.
  - Not exported from `staff/views/__init__.py` (it is private).
- `backend/staff/views/staff_statistics_domains.py`: `staff_statistics_domains`, with the
  `staff_cache_summary.py` decorator stack (`@restricted`, `@api_view(['GET'])`,
  `@permission_classes([AllowAny])` with the same comment) and `require_staff(request)` as the
  first statement. It returns `[{'id', 'domain'}]` for every `Domain`, ordered by `domain`
  (`values('id', 'domain')`), unpaginated, with no filter params.
- Export it from `staff/views/__init__.py` (import plus `__all__`), and register
  `path('staff/statistics/domains.json', views.staff_statistics_domains,
  name='staff-statistics-domains')` in `backend/staff/urls.py`.

Tests:

- `backend/staff/tests/staff_statistics_domains_test.py`, following `staff_cache_summary_test.py`:
  401 anonymous, 403 non-staff (including a DM), 200 staff with the shape and alphabetical
  order, an empty list with no domains, `X-Skip-Cache: true`, and non-GET rejected.
- `backend/staff/tests/staff_statistics_shared_test.py`: the helper returns a 400 with every
  error, valid filters pass through, and the envelope shape.

## Files to Change

- `backend/staff/views/_staff_statistics_shared.py`: new.
- `backend/staff/views/staff_statistics_domains.py`: new.
- `backend/staff/views/__init__.py`: export the new view.
- `backend/staff/urls.py`: register the route.
- `backend/staff/tests/staff_statistics_domains_test.py`: new.
- `backend/staff/tests/staff_statistics_shared_test.py`: new.

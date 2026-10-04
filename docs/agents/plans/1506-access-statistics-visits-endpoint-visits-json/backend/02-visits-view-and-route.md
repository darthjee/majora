# Add the visits.json view and route

Add `staff_statistics_visits`, mirroring `staff_statistics_domains`:

```python
@restricted
@api_view(['GET'])
# AllowAny: authentication/authorisation is enforced inline via require_staff ...
@permission_classes([AllowAny])
def staff_statistics_visits(request):
    error_response = require_staff(request)
    if error_response:
        return error_response
    filters, error_response = parse_statistics_filters(request)
    if error_response:
        return error_response
    buckets, totals = VisitsSeries(filters).build()
    return Response(statistics_envelope(filters, buckets, totals))
```

`require_staff` runs before parsing, so 401 / 403 never leak validation errors. Register it in
`staff/views/__init__.py` (import + `__all__`) and in `staff/urls.py` as
`staff/statistics/visits.json`, name `staff-statistics-visits`, next to the domains route.

Tests, following `staff_statistics_domains_test.py`:

- 401 anonymous, 403 regular user, 403 DM without staff, 200 staff, 200 superuser;
- `401` / `403` even with invalid params (check order);
- `X-Skip-Cache: true`; POST → 405; reachable via `reverse('staff-statistics-visits')`;
- 400 with `{"errors": {...}}` for invalid params (e.g. bad `tz` and `audience` together);
- 200 envelope: echoed `filters` (resolved granularity and `requested_granularity`), one bucket per
  day of the range with `start`, `end`, `anonymous`, `logged_in`, `visits` as integers, and
  `totals`, against a few seeded visits (anonymous and logged-in);
- `audience=logged_in` returns `anonymous: 0` everywhere but keeps the key.

Keep the edge-case matrix in the aggregation tests (step 01); the view tests cover the HTTP
contract and wiring.

## Files to Change

- `backend/staff/views/staff_statistics_visits.py` — new view.
- `backend/staff/views/__init__.py` — import and export the view.
- `backend/staff/urls.py` — add the `staff-statistics-visits` route.
- `backend/staff/tests/staff_statistics_visits_test.py` — new view tests.

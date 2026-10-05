# domains/summary.json view and URL

Add `backend/staff/views/staff_statistics_domains_summary.py` with `staff_statistics_domains_summary(request)`, mirroring `staff_statistics_overview.py`: `@restricted`, `@api_view(['GET'])`, `@permission_classes([AllowAny])` (with the same comment), inline `require_staff` first, then `parse_statistics_filters`, then:

```python
domains, totals = DomainsSummary(filters).build()
return Response(statistics_envelope(filters, totals=totals, domains=domains))
```

Export it from `backend/staff/views/__init__.py` (import + `__all__`, alphabetical next to `staff_statistics_domains`) and register it in `backend/staff/urls.py` after the `staff/statistics/duration.json` entry:

```python
path(
    'staff/statistics/domains/summary.json',
    views.staff_statistics_domains_summary,
    name='staff-statistics-domains-summary',
),
```

Tests in `backend/staff/tests/staff_statistics_domains_summary_test.py`, following `staff_statistics_duration_test.py`:
- `401` anonymous, `403` regular user and DM, `200` staff and superuser;
- `X-Skip-Cache: true` header on the response;
- `reverse('staff-statistics-domains-summary')` resolves to the URL;
- `400` with `{"errors": {...}}` on invalid params (e.g. bad `from`, `invalid_domain`, `invalid_audience`), and `401`/`403` win over invalid params;
- envelope keys are exactly `filters`, `domains`, `totals` (no `buckets`); row keys and types match the spec; `granularity` echoed in `filters`;
- domain filter row selection (omitted / id / missing id / `unknown`) at the HTTP level.

## Files to Change
- `backend/staff/views/staff_statistics_domains_summary.py` — new view.
- `backend/staff/views/__init__.py` — export the view.
- `backend/staff/urls.py` — new `staff-statistics-domains-summary` route.
- `backend/staff/tests/staff_statistics_domains_summary_test.py` — new view tests.

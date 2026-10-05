# duration.json view, URL and access-control row

Add `staff/views/staff_statistics_duration.py` with `staff_statistics_duration(request)`,
a copy of `staff_statistics_visits`' structure: `@restricted`, `@api_view(['GET'])`, the
`AllowAny` comment + `@permission_classes([AllowAny])`, `require_staff` first, then
`parse_statistics_filters`, then
`buckets, totals, histogram = DurationSeries(filters).build()` and
`Response(statistics_envelope(filters, buckets, totals, histogram=histogram))`.

Wire it: import + `__all__` in `staff/views/__init__.py`, and a `path('staff/statistics/duration.json',
views.staff_statistics_duration, name='staff-statistics-duration')` in `staff/urls.py` next to
the other statistics routes.

Tests in `staff/tests/staff_statistics_duration_test.py`, following
`staff_statistics_visits_test.py`: `401` anonymous (also with invalid params), `403` regular
user and DM, `200` staff and superuser, `X-Skip-Cache: true` header, `400` with the shared
error shape on invalid params (e.g. `from_after_to`, `invalid_granularity`), response has
`filters`, `buckets`, `totals`, `histogram` with the expected keys and values for a small
fixture, `reverse('staff-statistics-duration')` resolves to the URL.

Docs: in `docs/agents/access-control/staff-statistics.md`, add `duration.json` (#1513) to the
status note, a table row ("Visit duration and hits per visit for the Duration tab
(`GET /staff/statistics/duration.json`)" → **Staff-or-superuser**), and an Endpoints bullet
describing params (shared filters incl. `granularity`, not paginated), the envelope
`{"filters", "buckets": [{"start", "end", "visits", "single_hit_visits",
"average_duration_seconds", "median_duration_seconds", "average_hits", "median_hits"}],
"totals": {same six keys}, "histogram": [{"lower", "upper", "count"}]}`, `null`
averages / medians without visits, totals over all visits (not bucket sums), and that only
aggregated values are exposed (no user identities, no IPs).

## Files to Change

- `backend/staff/views/staff_statistics_duration.py` — new view.
- `backend/staff/views/__init__.py` — export the view.
- `backend/staff/urls.py` — `staff-statistics-duration` route.
- `backend/staff/tests/staff_statistics_duration_test.py` — new view tests.
- `docs/agents/access-control/staff-statistics.md` — status note, table row, endpoint bullet.

# Backend Plan: Access statistics: Visits endpoint (visits.json)

Main plan: [plan.md](plan.md)

## Overview

Implement the [Metrics](../../specs/access-statistics/visits.md#metrics) and
[API](../../specs/access-statistics/visits.md#api) sections of the Visits spec, covering its
[Edge cases](../../specs/access-statistics/visits.md#edge-cases) in tests.

## Context

- Shared backend (#1498, merged): `statistics/aggregation/` exports `StatisticsFilters`,
  `VisitQuery` (`rows(*fields)` returns `values_list` tuples over `[start_utc, end_utc)` with the
  user / domain / audience session lookups already applied), `BucketCalendar`, `Series`
  (`group(rows, timestamp_of)` then `map(reducer)` → `[{'start', 'end', **reducer(rows)}]`,
  zero-filled with `reducer([])`, oldest first) and `metrics.count`.
- `staff/views/_staff_statistics_shared.py` provides `parse_statistics_filters(request)` →
  `(filters, None)` or `(None, 400 Response)`, and `statistics_envelope(filters, buckets, totals)`.
- Reference view / tests: `staff/views/staff_statistics_domains.py` and
  `staff/tests/staff_statistics_domains_test.py` (decorator stack, 401 / 403 / DM 403 / 405 /
  `X-Skip-Cache` / URL-name tests).

Response contract (consumed by #1507):

```json
{
  "filters": { "from": "2026-09-28", "to": "2026-10-03", "tz": "Europe/Lisbon",
               "granularity": "day", "requested_granularity": "auto",
               "user": null, "domain": null, "audience": "all" },
  "buckets": [
    { "start": "2026-09-28", "end": "2026-09-28", "anonymous": 31, "logged_in": 6, "visits": 37 }
  ],
  "totals": { "anonymous": 53, "logged_in": 15, "visits": 68 }
}
```

## Steps

- [01 — Add the VisitsSeries aggregation](backend/01-visits-series-aggregation.md)
- [02 — Add the visits.json view and route](backend/02-visits-view-and-route.md)
- [03 — Document the endpoint's access control](backend/03-access-control-docs.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest statistics/tests/aggregation/visits_series_test.py staff/tests/staff_statistics_visits_test.py`, then the full `docker-compose run --rm majora_tests pytest` (CI jobs: `pytest_all`, `pytest_views_*`)
- `backend`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)
- docs: `yarn lint_md` (CI job: `markdownlint`)

## Notes

- ORM only, no raw SQL; one query (`values_list`), counted in Python.
- Never `import statistics` in the new module (the app name shadows the stdlib module); import
  from `statistics.aggregation` / relative imports like the existing files.
- Do **not** add the endpoint to `navi/` (restricted endpoint; `cache` review checks this).
- `data-access`, `security` and `cache` reviews are expected on the PR.

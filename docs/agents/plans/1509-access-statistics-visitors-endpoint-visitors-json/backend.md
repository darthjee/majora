# Backend Plan: Access statistics: Visitors endpoint (visitors.json)

Main plan: [plan.md](plan.md)

## Overview
Implement the **Metrics** and **API** sections of `docs/agents/specs/access-statistics/visitors.md` (built on `shared-infrastructure.md`). Follow the patterns of Visits (#1506) and Overview (#1503).

## Context
- `VisitQuery(filters).rows(*fields)` returns filtered in-range `Visit` tuples. `VisitQuery.visitor_key(user_id, session_id)` returns `('user', id)` or `('session', id)`.
- `Series(calendar).group(rows, ts).map(reducer)` zero-fills with `reducer([])`. The reducer only receives the rows, not the bucket.
- `BucketCalendar.key_for(dt)` returns a bucket start `date` (clipped to `from_date`). `filters.start_utc` / `end_utc` hold the UTC range.
- `ReturningVisitors` and `OverviewTotals` must stay **unchanged**.

## Steps

- [01 — Add FirstVisits lookup](backend/01-first-visits.md)
- [02 — Add VisitorsSeries aggregator](backend/02-visitors-series.md)
- [03 — Add visitors.json endpoint](backend/03-visitors-endpoint.md)

## CI Checks
- `backend`: `docker-compose run --rm majora_tests pytest statistics/tests/aggregation staff/tests/staff_statistics_visitors_test.py` (CI job: `pytest_all`)
- `backend`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)

## Notes
- Never `import statistics` for the stdlib module: the app name shadows it.
- Do not change `Series`. Inside the reducer, get the bucket start for non-empty rows with `calendar.key_for(rows[0][_STARTED_AT])`. Every row in a group shares that key, which is the same key `Series.group` used.
- Leave `docs/agents/access-control/staff-statistics.md` alone; the architect updates it.
- Do not touch `navi/`.

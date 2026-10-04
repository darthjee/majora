# Backend Plan: Access statistics: Overview endpoint (overview.json)

Main plan: [plan.md](plan.md)

## Overview

Implement the [API](../../specs/access-statistics/overview.md#api) section of the Overview
spec: an `OverviewTotals(filters)` aggregation class (one `VisitQuery` pass plus the
earlier-visits lookup) and a thin `staff_statistics_overview` view that wraps it in the shared
envelope with `filters` + `totals` only.

## Context

- The shared backend (#1498) and the Visits endpoint (#1506) are merged. Follow
  `backend/statistics/aggregation/visits_series.py` and
  `backend/staff/views/staff_statistics_visits.py` as the reference pattern.
- `statistics_envelope(filters, buckets=None, totals=None)` already omits `buckets` when
  `None`.
- `VisitQuery(filters).rows(*fields)` and `VisitQuery.visitor_key(user_id, session_id)` exist;
  `metrics.count`, `metrics.unique` and `metrics.average` (returns `None` on empty) exist.
- Response contract (`totals`): `visits`, `unique_visitors`, `logged_in_users`,
  `new_visitors`, `returning_visitors` (non-negative ints) and `average_duration_seconds`
  (rounded int, or `null` when there are no visits).

## Steps

- [01 — Add the OverviewTotals aggregation](backend/01-overview-totals-aggregation.md)
- [02 — Add the overview.json view and URL](backend/02-overview-view.md)
- [03 — Document overview.json access control](backend/03-access-control-doc.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` and ruff (`ruff check .`) via
  docker-compose (CI jobs: `pytest_views_rest`, `pytest_all`, `checks`)

## Notes

- Do **not** add the endpoint to the Navi warm-up chain (`navi/`); the `cache` review only
  checks that `X-Skip-Cache` is set via `@restricted`.
- The spec's "implement Overview last" note is not a constraint (decided in the issue).
- Never `import statistics` for stdlib helpers: the app name shadows the stdlib module.
- No raw SQL; no pagination params.

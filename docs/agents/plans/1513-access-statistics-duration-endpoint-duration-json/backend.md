# Backend Plan: Access statistics: Duration endpoint (duration.json)

Main plan: [plan.md](plan.md)

## Overview

Implement the Duration tab endpoint from `docs/agents/specs/access-statistics/duration.md`
(sections Metrics, Histogram, API, Edge cases). All shared building blocks from #1498 already
exist in `backend/statistics/aggregation/` (`VisitQuery`, `BucketCalendar`, `Series`,
`metrics.count` / `average` / `median` / `histogram`) and in
`backend/staff/views/_staff_statistics_shared.py` (`parse_statistics_filters`,
`statistics_envelope(filters, buckets, totals, **extra)`).

## Context

- `VisitsSeries` (`statistics/aggregation/visits_series.py`) and the
  `staff_statistics_visits` view are the closest templates: one `VisitQuery(...).rows(...)`
  pass, `Series(BucketCalendar(filters)).group(rows, ...).map(reducer)`, a thin view.
- Unlike Visits, `totals` must be the reducer applied to **all** rows (never summed from
  buckets): averages and medians do not add up.
- `OverviewTotals._duration_seconds(row)` computes `int((last_seen_at - started_at).total_seconds())`
  and `_average_duration` rounds with `round()`. Duration must use the exact same definition
  so `totals.average_duration_seconds` equals Overview's.

## Steps

- [01 — Shared visit-duration helper](backend/01-shared-duration-helper.md)
- [02 — DurationSeries aggregator](backend/02-duration-series.md)
- [03 — duration.json view, URL and access-control row](backend/03-duration-view.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest statistics/tests/aggregation staff/tests`
  (CI job: `pytest_all`)
- `backend`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)
- docs: `docker-compose run --rm markdownlint` (CI job: `markdownlint`)

## Notes

- Do **not** add the endpoint to Navi (`navi/resources/*.yml`); the `cache` review only
  confirms `X-Skip-Cache` is set via `@restricted`.
- Python's `round()` uses banker's rounding (`round(2.5) == 2`). Keep it for durations, since
  Overview uses it and the totals must match; for `average_hits` use `round(x, 1)`. Tests
  should avoid relying on exact `.5` tie behaviour except where intentional.
- `median_hits` stays as returned by `metrics.median` (an `int` for odd counts, a `float`
  possibly ending in `.5` for even counts). Do not round it.
- `data-access`, `security` and `cache` reviews are expected on the PR.

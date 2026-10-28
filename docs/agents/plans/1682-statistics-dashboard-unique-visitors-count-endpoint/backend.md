# Backend Plan: Statistics dashboard: unique-visitors count endpoint

Main plan: [plan.md](plan.md)

## Overview

Add `GET staff/statistics/summary.json?period=day|week|month&tz=<IANA zone>`. It returns
`{period, from, to, tz, unique_visitors}` for a rolling window of local days in `tz` ending
today. The contract is in `docs/agents/specs/statistics_dashboard/count-endpoint.md`.

## Context

- `overview.json` already returns `totals.unique_visitors`, but it loads every row into
  Python and runs the returning-visitors lookup, which is too heavy for the dashboard card.
- The new endpoint reuses `StatisticsFilters` and `VisitQuery`, so its window bounds
  (`start_utc` / `end_utc`, DST included) and its "started inside the range" rule are the same
  as `overview.json`'s by construction.
- Only `period` and `tz` are read; any other param is ignored, not validated.

## Steps

- [01 — Summary params parsing](backend/01-summary-params-parsing.md)
- [02 — Unique visitors count aggregation](backend/02-unique-visitors-count.md)
- [03 — Summary view and route](backend/03-summary-view-and-route.md)
- [04 — Access-control doc](backend/04-access-control-doc.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI job: `pytest_all`)
- `backend`: `docker-compose run --rm majora_tests ruff check .` and
  `docker-compose run --rm majora_tests bin/reports.sh ci` (CI job: `checks`)
- `docs`: `docker-compose run --rm markdownlint yarn lint_md` (CI job: `markdownlint`)

## Notes

- Never `import statistics` for the stdlib helpers: the app name shadows that module.
- No migration, no new index, no server-side cache, no navi resource, no proxy handler.
- The frontend card is #1685 and the clear endpoint is #1684; both are out of scope.
- The cache, data-access and security agents review the change.

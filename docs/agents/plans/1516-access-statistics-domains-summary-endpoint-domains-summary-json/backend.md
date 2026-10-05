# Backend Plan: Access statistics: Domains summary endpoint (domains/summary.json)

Main plan: [plan.md](plan.md)

## Overview

Implement `GET /staff/statistics/domains/summary.json` as specced in `docs/agents/specs/access-statistics/domains.md` (sections **Metrics**, **Filters**, **API**, **Edge cases**). It builds on the shared backend from #1498 (`VisitQuery`, `metrics`, `StatisticsFilters`, `parse_statistics_filters`, `statistics_envelope`), all already merged.

## Context

- Response: `{"filters": {...}, "domains": [row, ...], "totals": {six metrics}}`.
- Row: `id` (`Domain.id` or `"unknown"`), `domain` (hostname or `null`), `group` (`DomainGroup.name` or `null`), `visits`, `anonymous`, `logged_in`, `unique_visitors`, `average_duration_seconds`, `median_duration_seconds`. Durations are rounded with `round()` to ints, and are `null` without visits.
- `totals`: the same reducer over all matched rows (never summed from rows), so `visits` / `unique_visitors` / `average_duration_seconds` equal `OverviewTotals`, and `median_duration_seconds` equals `DurationSeries` totals.
- Order: `visits` desc, then `domain` asc; unknown always last.
- Domain filter → rows: omitted = all configured domains + unknown; existing id = that row; missing id = `[]` and zero totals; `unknown` = unknown row only.
- `granularity` is parsed/echoed by the shared parser and otherwise ignored.

## Steps

- [01 — DomainsSummary aggregation](backend/01-domains-summary-aggregation.md)
- [02 — domains/summary.json view and URL](backend/02-domains-summary-view.md)
- [03 — Access-control and spec docs](backend/03-access-control-docs.md)

## CI Checks

- `backend`: `pytest` for `statistics/tests/aggregation/domains_summary_test.py` and `staff/tests/staff_statistics_domains_summary_test.py`, plus the full suite (CI jobs: `pytest_all`, `pytest_views_rest`), run through `docker-compose` (`make tests`), never on the host.
- Lint (`checks` CI job): flake8 / pylint / docstring rules as used by the other `statistics/aggregation` files.
- `markdownlint` CI job for the doc changes.

## Notes

- Never `import statistics` for stdlib helpers in the aggregation module (the app name shadows it); use `from . import metrics`.
- Keep the existing `staff/statistics/domains.json` (filter support endpoint) untouched.
- Not added to Navi (`navi/`); no proxy change. `@restricted` provides `X-Skip-Cache: true`.
- `data-access`, `security` and `cache` reviews are required by the issue.

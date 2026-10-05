# Plan: Access statistics: Users ranking endpoint (users.json)

Issue: [1519-access-statistics-users-ranking-endpoint-users-json.md](../../issues/1519-access-statistics-users-ranking-endpoint-users-json.md)

## Overview
Implement `GET /staff/statistics/users.json` as specified in
`docs/agents/specs/access-statistics/users.md` (sections Metrics, Ordering, Filters, API, Edge cases).

- A new `UsersRanking(filters, sort)` aggregation runs one `VisitQuery` pass over logged-in sessions,
  reduces the rows per user and sorts them.
- The view validates `sort` together with the shared params and paginates the sorted rows with the
  shared `Paginator`.
- The view then merges in identities from one `User` query.

## Context
- Shared backend from #1498 is merged: `StatisticsParamsParser` (already strictly validates `page`
  / `per_page`), `StatisticsFilters`, `VisitQuery`, `metrics`, and
  `staff/views/_staff_statistics_shared.py` (`parse_statistics_filters`, which builds the `400`
  itself).
- Sibling views to mirror: `staff/views/staff_statistics_duration.py` (decorators, `require_staff`,
  parse) and `statistics/aggregation/duration_series.py` (row tuples, `metrics.duration_seconds`,
  rounding).
- `games/paginator.py` `Paginator(request, queryset)` calls `queryset.count()` with no args and
  slices `queryset[start:end]`; its own page parsing is lenient, which is fine because the parser
  has already rejected bad `page` / `per_page`.
- The frontend (#1520) consumes this endpoint. The response shape is fixed by the spec's API
  section.

## Steps

- [01 — UsersRanking aggregation](backend/01-users-ranking-aggregation.md)
- [02 — Merge the sort error into the shared validation](backend/02-shared-sort-validation.md)
- [03 — users.json view, URL and tests](backend/03-users-view.md)
- [04 — Access-control doc row](backend/04-access-control-doc.md)

## CI Checks
- `backend`: `docker-compose run --rm majora_tests pytest statistics/tests/aggregation/users_ranking_test.py staff/tests/staff_statistics_users_test.py staff/tests/staff_statistics_shared_test.py` (CI job: `pytest_all`)
- `backend`: `docker-compose run --rm majora_tests ruff check .` and `bin/reports.sh ci` (CI job: `checks`)
- `docs`: markdownlint on the edited access-control doc (CI job: `markdownlint`)

## Notes
- No migrations, no Navi changes: the endpoint is `@restricted` and stays out of the warm-up chain.
  The `cache` review should only confirm `X-Skip-Cache`.
- `display_name` must be `null` when blank or when the user has no profile. Do not reuse
  `StaffUserListSerializer`: it also emits `status` and would fail on a missing profile. Build the
  identity dict by hand with the same key names.
- Do not `import statistics` for stdlib helpers (the app name shadows it). Use the local `metrics`
  module.
- Reviews to run after implementation: `data-access`, `security`, `cache`.

# Frontend Plan: Access statistics: Overview tab (KPI tiles)

Main plan: [plan.md](plan.md)

## Shared contracts

- Consumes `GET /staff/statistics/overview.json` → `{ filters, totals }`, where `totals` holds
  `visits`, `unique_visitors`, `logged_in_users`, `new_visitors`, `returning_visitors`
  (integers) and `average_duration_seconds` (integer or `null`). See
  [plan.md](plan.md#backend-response-already-merged-in-1503-consumed-by-frontend).
- Consumes the `staff_statistics_page.overview.*` i18n keys produced by the translator (see
  [plan.md](plan.md#i18n-keys-translator-produces-frontend-consumes)). Pass numbers to
  `{{count}}` / `{{share}}` already formatted.

## Steps

- [01 — Request config and duration formatter](frontend/01-config-and-duration-formatter.md)
- [02 — Hide granularity on demand](frontend/02-hide-granularity.md)
- [03 — Overview controller](frontend/03-overview-controller.md)
- [04 — KPI tile element and render helper](frontend/04-kpi-tile-and-helper.md)
- [05 — Body element and page rename](frontend/05-body-and-page-rename.md)

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn coverage` and
  `docker-compose run --rm majora_fe yarn lint` (CI jobs: `jasmine`, `frontend-checks`)

## Notes

- The Visitors, Users and Duration tabs are still placeholders. The tiles link to them
  anyway, since their routes exist, so do not gate the links.
- Coverage must stay complete for every new file. Cover the empty range (all zeros, `null`
  average), the `null` average alone, normal data, and the one-hour boundary of the duration
  formatter.
- Do not touch `StaffStatisticsPlaceholder`: the other tabs still render it.

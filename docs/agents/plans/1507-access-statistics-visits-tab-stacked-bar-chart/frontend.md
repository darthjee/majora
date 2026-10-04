# Frontend Plan: Access statistics: Visits tab (stacked bar chart)

Main plan: [plan.md](plan.md)

## Shared contracts

Relies on the translator adding `staff_statistics_page.visits.{title,total,anonymous,logged_in,logged_in_share,empty,load_error}`
(en + pt), see [plan.md — Shared contracts](plan.md#shared-contracts). Compose labels in code as
`"<label>: <formatted value>"`.

Relies on the merged backend (#1506): `GET /staff/statistics/visits.json` returns
`{ filters: { from, to, tz, granularity, requested_granularity, user, domain, audience }, buckets: [{ start, end, anonymous, logged_in, visits }], totals: { anonymous, logged_in, visits } }`,
where `start` / `end` are inclusive `YYYY-MM-DD` dates clipped to the range, buckets are zero-filled
and oldest first, and both `anonymous` and `logged_in` are always present (the filtered-out one is
`0` under an audience filter).

## Steps

- [01 — Add the `visits` quantity type](frontend/01-visits-quantity-type.md)
- [02 — Bucket formatting helpers](frontend/02-bucket-formatting-helpers.md)
- [03 — VisitsController](frontend/03-visits-controller.md)
- [04 — VisitsChart and VisitsChartHelper](frontend/04-visits-chart.md)
- [05 — Wire the Visits page](frontend/05-visits-page.md)

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)

## Notes

- Changing a filter navigates to a new hash, which **remounts** the page (see
  `StaffStatisticsFiltersController`). The controller only needs a mount-time fetch, with no
  hash listener.
- `YYYY-MM-DD` strings parse as UTC midnight. Format them with `timeZone: 'UTC'` in
  `Intl.DateTimeFormat`, otherwise browsers west of UTC show the previous day.
- `Intl` output depends on the locale. Helpers take an optional `locale` argument (default
  `undefined` = browser locale), and specs pass `'en-GB'` / `'en-US'` explicitly to stay
  deterministic.
- Leave the demo `TimeSeriesChart` on the Visitors tab (#1500) alone; it is out of scope.
- Under `renderToStaticMarkup`, `StaffStatisticsCharts` may render its `charts_loading` fallback
  or the chart. Page specs must accept either one (shared-infrastructure "Tests" convention).
- Keep to the repo's ESLint complexity / JSDoc rules: one JSDoc block per public method, and
  private `#helpers` for branches.

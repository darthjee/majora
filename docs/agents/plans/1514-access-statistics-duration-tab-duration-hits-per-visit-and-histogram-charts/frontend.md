# Frontend Plan: Access statistics: Duration tab (duration, hits per visit and histogram charts)

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend reads the `staff_statistics_page.duration.*` keys and the bin `labelKey` mapping defined in [plan.md](plan.md#shared-contracts). The translator agent adds the strings. Specs that assert translated text must go through `Translator.t(...)`, never hard-coded English.

Backend response (merged in #1513, see `docs/agents/specs/access-statistics/duration.md#api`):
- `filters`;
- `buckets[]` of `{ start, end, visits, single_hit_visits, average_duration_seconds, median_duration_seconds, average_hits, median_hits }`. The four averages and medians are `null` on empty buckets;
- `totals`, with the same six keys;
- `histogram[]` of `{ lower, upper, count }`: always 8 entries, with `upper: null` on the last one.

## Steps

- [01 — Request config and controller](frontend/01-request-config-and-controller.md)
- [02 — Chart components](frontend/02-chart-components.md)
- [03 — Page, body and tab helper](frontend/03-page-body-and-helper.md)

## CI Checks
- `frontend`:
  - `docker-compose run --rm majora_fe yarn test`
  - `docker-compose run --rm majora_fe yarn lint_fix`

  Both run through `.claude/scripts/check_frontend.sh`.

## Notes
- **Visitors is the model to follow.** Mirror `VisitorsController`, `StaffStatisticsVisitorsBody`, `StaffStatisticsVisitorsHelper` and `VisitorsChartTooltip`/`VisitorsChartTooltipHelper` in structure, JSDoc style and spec layout (`frontend/specs/assets/js/...`).
- **Dedicated charts.** Do not use or modify the generic `TimeSeriesChart`. The dedicated charts are a decision from the #1514 discussion.
- **Gaps and dots.** `connectNulls={false}` makes empty buckets gaps. With `dot={false}`, an isolated bucket between two gaps would be invisible, so keep a small dot (e.g. `dot={{ r: 2 }}`) on both line charts.
- **Histogram labels.** Translate the bin labels at render time, not in the controller, so they follow the current locale (same as `chartSeries`).

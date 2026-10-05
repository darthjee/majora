# Issue: Access statistics: Duration tab (duration, hits per visit and histogram charts)

## Description
Frontend of the access statistics **Duration** tab (#1477), at `/staff/statistics/duration`. Spec: `docs/agents/specs/access-statistics/duration.md` (specced in #1486), sections **Filters** and **Chart and layout**, built on `docs/agents/specs/access-statistics/shared-infrastructure.md`. Read the details there instead of a copy here.

Dependencies #1499 (frontend shell, filter bar, RequestStore), #1500 (Recharts setup) and #1513 (`duration.json`) are all merged.

## Problem
`StaffStatisticsDuration.jsx` still renders the shell placeholder. The backend `GET /staff/statistics/duration.json` exists, but there is no frontend quantity type, controller or charts using it.

## Expected Behavior
- A **totals line**: visits, average and median duration, average hits per visit, and the single-hit share (whole percentage, hidden when `visits == 0`). Durations use `StatisticsDurationFormatter`; numbers use `Intl.NumberFormat`.
- **Duration chart** (`LineChart`, `data-testid="statistics-duration-chart"`): `average_duration_seconds` (`--majora-chart-1`) and `median_duration_seconds` (`--majora-chart-2`) per bucket, with the Y axis ticks formatted by the duration formatter.
- **Hits per visit chart** (`LineChart`, `data-testid="statistics-hits-per-visit-chart"`): `average_hits` and `median_hits` per bucket, with `Intl.NumberFormat` ticks (at most one decimal).
- **Histogram** (`BarChart`, `data-testid="statistics-duration-histogram-chart"`, `--majora-chart-3`, no legend): always the eight fixed, translated bins (`0 s`, `<30 s`, `30 s–1 m`, `1–3 m`, `3–10 m`, `10–30 m`, `30 m–1 h`, `≥1 h`) over the whole range, with `allowDecimals={false}`.
- In both line charts, empty buckets are **gaps** (`connectNulls={false}`), not zeros.
- **Custom tooltips**:
  - **Time-series charts:** the clipped bucket range, both values (`—` when `null`), the visit count and the single-hit share (hidden when the bucket has no visits).
  - **Histogram:** the bin label, its count and its share of `totals.visits` (hidden when that is `0`).
- **Filters:** every shared filter applies, the granularity control is shown along with the resolved granularity, and there is no audience split (one series per metric). Granularity only affects the two line charts.
- **States:**
  - **Loading:** `LoadingMessage`.
  - **Error:** the shared error message.
  - **Empty** (`totals.visits == 0`): a "No visits in this range" note, and the charts are still drawn.

## Solution
Follow the layering of the Visitors tab (#1510):

- **Request config:** add a `duration` quantity type to `utils/requests/config/staffStatisticsConfig.js` (`path: () => '/staff/statistics/duration.json'`, same `regular` / `private` variant, `permission: null`).
- **Page:** `pages/StaffStatisticsDuration.jsx` replaces the placeholder with `StaffStatisticsAccessGate` > `pages/elements/StaffStatisticsDurationBody.jsx`. The body renders `StaffStatisticsShell tab="duration"` with `resolvedGranularity`, and delegates its loading, error, empty and charts states to `pages/helpers/StaffStatisticsDurationHelper.jsx`.
- **Controller:** `pages/controllers/DurationController.js` reads the data through the RequestStore with `StatisticsQuery.fromHash()` and maps the response to three outputs. It is unit-tested with fake setters.
  - `points`: `{ start, end, label, visits, single_hit_visits, singleHitShare, average_duration_seconds, median_duration_seconds, average_hits, median_hits }`. Labels come from `StatisticsBucketFormatter.label`.
  - `bins`: `{ lower, upper, labelKey, count, share }`.
  - `totals`: the response totals plus `singleHitShare`.
- **Charts** (lazy chunk, re-exported from `charts/index.js`, rendered through `StaffStatisticsCharts`):
  - `charts/DurationChart.jsx`, `charts/HitsPerVisitChart.jsx` and `charts/DurationHistogramChart.jsx`, each with its `charts/helpers/*ChartHelper.jsx` (a pure `render(...)`). These are dedicated components, like the Visits/Visitors charts. The generic `TimeSeriesChart` from #1500 is left unchanged and is not used here;
  - tooltip components `charts/DurationChartTooltip.jsx` with `charts/helpers/DurationChartTooltipHelper.jsx`, shared by both line charts, plus a histogram tooltip, following the `VisitorsChartTooltip` pattern.
- **Reuse:** `StatisticsBucketFormatter` (`label`, `range`, `count`, `percent`) and `StatisticsDurationFormatter`. The only new formatting is the bin label keys.
- **i18n:** `staff_statistics_page.duration.*` keys from the spec, in en and pt.
- **Tests:** Jasmine specs for the controller and helpers, covering empty data, a single bucket, normal data and `null` metrics. The three chart components get smoke tests (empty, single point, normal).

## Out of scope
Previous-period comparison, an audience split, configurable or per-bucket histogram bins, and percentiles beyond the median (all deferred in the spec).

## Acceptance criteria
- [ ] The Duration tab renders the totals line and the three charts from `duration.json` with the current filters.
- [ ] Empty buckets are drawn as gaps in both line charts. The histogram always shows the eight bins.
- [ ] Controller and formatting helpers are fully covered by Jasmine specs (empty, single bucket, normal data, `null` metrics). The three chart components have smoke tests (empty, single-point, normal).
- [ ] Translations are present in both languages.

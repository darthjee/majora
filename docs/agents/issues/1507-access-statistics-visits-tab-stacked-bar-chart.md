# Issue: Access statistics: Visits tab (stacked bar chart)

## Description

Frontend of the access statistics **Visits** tab (#1477), at `/staff/statistics/visits`. Spec: `docs/agents/specs/access-statistics/visits.md` (specced in #1484), built on `docs/agents/specs/access-statistics/shared-infrastructure.md`. This issue implements the spec's **Filters** and **Chart and layout** sections, plus the frontend `visits` quantity type and translations; read the spec for the full details instead of a copy here.

> The Visits tab is implemented **first** among the tabs: it proves the end-to-end pipeline (shared backend #1498 → frontend shell #1499 → Recharts setup #1500 → `visits.json` #1506 → this tab).

All dependencies are merged: #1499 (frontend shell, filter bar, RequestStore), #1500 (Recharts setup) and #1506 (`GET /staff/statistics/visits.json`).

## Problem

`StaffStatisticsVisits.jsx` still renders the shell's `StaffStatisticsPlaceholder`. The backend endpoint `visits.json` exists, but the frontend has no `visits` quantity type in `staffStatisticsConfig.js` (only `domains`), no Visits chart in the lazy charts chunk (only the generic line `TimeSeriesChart`), and no `visits.*` translations.

## Expected Behavior

- **Totals line** above the chart: total visits, anonymous and logged-in (`Intl.NumberFormat`, browser locale), following the audience filter (hidden counts are not shown).
- **Chart**: a Recharts stacked `BarChart` in the shared `<ResponsiveContainer width="100%" height={300}>`, wrapped in `<div data-testid="statistics-visits-chart">`, one bar per zero-filled bucket:
  - categorical `XAxis` (`dataKey="label"`), `YAxis` with `allowDecimals={false}`;
  - two `Bar`s with `stackId="visits"`: `anonymous` (`var(--majora-chart-1)`) at the bottom, `logged_in` (`var(--majora-chart-2)`) on top;
  - `CartesianGrid` / axes using `var(--majora-chart-grid)` / `var(--majora-chart-axis)`, a `Legend`, `isAnimationActive={false}`, following the shared Recharts conventions.
- **Tooltip** (custom `content`): the clipped bucket range via `Intl.DateTimeFormat` (a single date when `start == end`), the anonymous / logged-in / total counts (hidden series omitted), and the logged-in share as a whole percentage, hidden when the total is 0 or the audience filter is not `all`.
- **Bucket labels**: day and week buckets show day and month (e.g. "5 Jan"; a week is labeled by its clipped start), month buckets show month and year (e.g. "Jan 2026").
- **Filters**: every shared filter applies; the granularity control is shown, with the resolved granularity (the response's `filters.granularity`) passed to `StaffStatisticsShell` as `resolvedGranularity` so it appears next to "Auto". With `audience=anonymous` / `logged_in` (read from the echoed `filters.audience`), the filtered-out series and its legend entry are hidden.
- **States**: loading shows `LoadingMessage` (the lazy chart chunk already has its own `Suspense` fallback); error shows the shared staff-page error message; empty (`totals.visits == 0`) still draws the zero-filled chart with a "No visits in this range" note above it.

## Solution

- `utils/requests/config/staffStatisticsConfig.js`: add a `visits` quantity type (`path: () => '/staff/statistics/visits.json'`, same object for `regular` / `private`, `permission: null`). #1506 did not add it.
- `pages/StaffStatisticsVisits.jsx` (route `staffStatisticsVisits`): replace the placeholder with the totals line, the empty note and the chart. Render the chart through the existing lazy entry `<StaffStatisticsCharts chart="VisitsChart" … />` from #1500.
- `pages/controllers/VisitsController.js`: a RequestStore read of `visits` with `StatisticsQuery.fromHash()`. It maps `buckets` to a flat, oldest-first array of `{ start, end, label, anonymous, logged_in, visits, loggedInShare }` (`loggedInShare` is `null` when `visits == 0`) and derives the visible series from `filters.audience`. Unit-tested with fake setters.
- `charts/VisitsChart.jsx`: the `data-testid` wrapper and `ResponsiveContainer`, re-exported from `charts/index.js` next to `TimeSeriesChart`.
- `charts/helpers/VisitsChartHelper.jsx`: a pure `render(points, { series })` that returns the Recharts tree, plus the tooltip content.
- Pure bucket-label and range formatting helpers in `pages/helpers/`, reusable by later time-series tabs and unit-tested.
- i18n: a new top-level `visits:` block in the `staff_statistics_page` namespace (separate from the existing `tabs.visits`) with `visits.title`, `visits.total`, `visits.anonymous`, `visits.logged_in`, `visits.logged_in_share` and `visits.empty` (en + pt). The legend and tooltip reuse `visits.anonymous` / `visits.logged_in`.

### Out of scope

- A hits series and previous-period comparison (deferred in the spec).
- The demo `TimeSeriesChart` wiring on the Visitors tab from #1500. The Visitors tab issue replaces it.

### Acceptance criteria

- [ ] The Visits tab renders the stacked bar chart from `visits.json` with the current filters, one bar per bucket.
- [ ] The audience filter hides the filtered-out series and its legend entry.
- [ ] The resolved granularity is shown next to "Auto" in the filter bar.
- [ ] Controller and formatting helpers are fully covered by Jasmine specs (empty, single bucket, normal data, each audience). The chart component has smoke tests (empty, single-point, normal).
- [ ] Translations are present in both languages.

## Benefits

Delivers the first real statistics tab and validates the whole access-statistics pipeline end to end, and it leaves bucket-label and range formatting helpers ready for the later time-series tabs.

# Issue: Access statistics: Visitors tab (new vs returning, anonymous vs logged-in)

## Description
Frontend of the access statistics **Visitors** tab (#1477), at `/staff/statistics/visitors`. Spec: `docs/agents/specs/access-statistics/visitors.md` (specced in #1485, sections "Filters" and "Chart and layout"), built on `docs/agents/specs/access-statistics/shared-infrastructure.md`. Read the spec for the details instead of a copy here.

All dependencies are merged: #1499 (frontend shell, filter bar, RequestStore), #1500 (Recharts setup), #1509 (`visitors.json`), and the Visits tab (#1507), whose structure this tab mirrors.

## Problem
`StaffStatisticsVisitors.jsx` still renders the shell placeholder: staff cannot see unique visitors over time, nor the new vs returning and anonymous vs logged-in splits that `visitors.json` already returns.

## Expected Behavior
- A **summary row** of the range totals (unique visitors, new, returning with the returning share hidden when unique is 0, anonymous and logged-in following the audience filter), formatted with `Intl.NumberFormat`, with the notes that range totals are not sums of the bars and that "new" means "first visit recorded".
- Two Recharts stacked `BarChart`s sharing the X axis over the zero-filled buckets, stacked vertically:
  1. new (`--majora-chart-3`) vs returning (`--majora-chart-4`), `data-testid="statistics-visitors-new-returning-chart"`, always both series;
  2. anonymous (`--majora-chart-1`) vs logged-in (`--majora-chart-2`), `data-testid="statistics-visitors-audience-chart"`; with `filters.audience` = `anonymous` / `logged_in` the filtered-out series and its legend entry are hidden.
- Legends and custom tooltips: clipped date range (single date when `start == end`), both visible series, the total, and the share (returning share on chart 1, logged-in share on chart 2) hidden when the total is 0 (and, on chart 2, when the audience filter is not `all`).
- Every shared filter applies; the filter bar shows the granularity control with the resolved granularity.
- States: loading (`LoadingMessage`, also the lazy chart chunk fallback), the shared error message, and empty (`totals.unique_visitors == 0`: both zero-filled charts still drawn, with a "No visitors in this range" note).
- Out of scope: previous-period comparison and retention (deferred), any backend change.

## Solution
Mirror the Visits tab (#1507) layering, under `frontend/assets/js/components/resources/staff_statistics/`:

- `utils/requests/config/staffStatisticsConfig.js`: a `visitors` quantity type (`/staff/statistics/visitors.json`, same `regular` / `private` variant, `permission: null`).
- `pages/StaffStatisticsVisitors.jsx`: replaces the placeholder with `StaffStatisticsAccessGate` + `elements/StaffStatisticsVisitorsBody.jsx` (shell with `tab="visitors"` and the resolved granularity).
- `pages/controllers/VisitorsController.js`: RequestStore read with `StatisticsQuery.fromHash()`; maps `buckets` to points `{ start, end, label, unique_visitors, new_visitors, returning_visitors, anonymous, logged_in, returningShare, loggedInShare }` (shares `null` when unique is 0), plus totals, granularity and the visible audience series from `filters.audience`.
- `pages/helpers/StaffStatisticsVisitorsHelper.jsx`: loading / error / empty / data states, the summary row and the two lazy charts through `StaffStatisticsCharts`.
- `charts/VisitorsNewReturningChart.jsx` and `charts/VisitorsAudienceChart.jsx` (re-exported from `charts/index.js`), with `charts/helpers/VisitorsNewReturningChartHelper.jsx` / `VisitorsAudienceChartHelper.jsx` (pure `render(points, { series })`) and their tooltip component / helper, following `VisitsChartTooltip`.
- Reuse `StatisticsBucketFormatter` for bucket labels, date ranges and percentages.
- Generalize `charts/helpers/visitsSeries.js` into a shared series helper taking the series definitions (key + color, in stack order) and the i18n prefix; the Visits chart and both Visitors charts use it (Visits behavior unchanged, its specs updated).
- Summary row reuses `pages/elements/StatisticsKpiTile.jsx`, with `href` made optional: without it the title is plain text and there is no stretched link (Overview tiles unchanged).
- i18n: `staff_statistics_page` namespace, `visitors.*` keys from the spec (en + pt).

### Acceptance criteria
- [ ] The Visitors tab renders the summary row and both stacked bar charts from `visitors.json` with the current filters, one bar per bucket.
- [ ] The audience filter hides the filtered-out series and legend entry of the anonymous vs logged-in chart, and the matching summary count.
- [ ] Controller and formatting helpers fully covered by Jasmine specs (empty, single bucket, normal data, each audience); both chart components have smoke tests (empty, single-point, normal).
- [ ] The Visits tab and Overview tiles behave as before after the shared series helper and optional `href` changes.
- [ ] Translations present in both languages.

## Benefits
Completes the Visitors tab of the access statistics dashboard, giving staff the audience-growth view (new vs returning, anonymous vs logged-in) with numbers consistent with the Overview tiles.

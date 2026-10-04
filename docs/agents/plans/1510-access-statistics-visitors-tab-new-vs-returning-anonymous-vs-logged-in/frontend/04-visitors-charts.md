# Add the two Visitors charts

Mirror `VisitsChart` / `VisitsChartHelper` / `VisitsChartTooltip` / `VisitsChartTooltipHelper`:

- `charts/VisitorsNewReturningChart.jsx`: `<div data-testid="statistics-visitors-new-returning-chart">` + `<ResponsiveContainer width="100%" height={300}>` around `VisitorsNewReturningChartHelper.render(points)`.
- `charts/VisitorsAudienceChart.jsx`: `<div data-testid="statistics-visitors-audience-chart">`, same container, `VisitorsAudienceChartHelper.render(points, { series })`.
- `charts/helpers/VisitorsNewReturningChartHelper.jsx` / `VisitorsAudienceChartHelper.jsx`: `BarChart data={points}` with `CartesianGrid` (`var(--majora-chart-grid)`), `XAxis dataKey="label"` and `YAxis allowDecimals={false}` (`var(--majora-chart-axis)`), `Tooltip` with the custom content, `Legend`, then one `Bar` per series from `chartSeries` (`stackId="new-returning"` with `NEW_RETURNING_SERIES`, always both; `stackId="audience"` with `AUDIENCE_SERIES` filtered to `series`), `isAnimationActive={false}`. Labels from `staff_statistics_page.visitors`.
- Tooltip: a `VisitorsChartTooltip.jsx` component (null when inactive / no payload) plus `VisitorsChartTooltipHelper.jsx` taking the point and a chart mode (`newReturning` or `audience` + visible series). It renders `StatisticsBucketFormatter.range(start, end)`, one line per visible series (`count`), `visitors.total` with `unique_visitors`, and the share: `returning_share` (`returningShare`) for chart 1, `logged_in_share` (`loggedInShare`) for chart 2 only when both audience series are visible; hidden when the share is `null`. `data-testid="statistics-visitors-tooltip"`.
- Re-export both charts from `charts/index.js`.
- Specs: smoke tests for both chart components (empty, single-point, normal), helper specs for bar order / series filtering, tooltip helper specs for each mode, hidden share at zero and with a filtered audience, and the inactive tooltip returning `null`.

## Files to Change
- `frontend/assets/js/components/resources/staff_statistics/charts/VisitorsNewReturningChart.jsx` — new.
- `frontend/assets/js/components/resources/staff_statistics/charts/VisitorsAudienceChart.jsx` — new.
- `frontend/assets/js/components/resources/staff_statistics/charts/VisitorsChartTooltip.jsx` — new.
- `frontend/assets/js/components/resources/staff_statistics/charts/helpers/VisitorsNewReturningChartHelper.jsx` — new.
- `frontend/assets/js/components/resources/staff_statistics/charts/helpers/VisitorsAudienceChartHelper.jsx` — new.
- `frontend/assets/js/components/resources/staff_statistics/charts/helpers/VisitorsChartTooltipHelper.jsx` — new.
- `frontend/assets/js/components/resources/staff_statistics/charts/index.js` — re-exports.
- `frontend/specs/assets/js/components/resources/staff_statistics/charts/` and `frontend/specs/assets/js/components/resources/staff_statistics/charts/helpers/` — matching specs.

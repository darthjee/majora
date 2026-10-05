# Domains chart

- `DomainsChart.jsx`: `<div data-testid="statistics-domains-chart">` wrapping a `ResponsiveContainer`
  with height `Math.max(300, rows.length * 32 + 60)` and `DomainsChartHelper.render(rows, { series })`.
- `DomainsChartHelper.jsx`: `BarChart layout="vertical"`, `CartesianGrid`, `XAxis type="number" allowDecimals={false}`,
  `YAxis type="category" dataKey="label"`, Tooltip (custom content), Legend, Bars with `stackId="visits"` via
  `chartSeries(AUDIENCE_SERIES, series, 'staff_statistics_page.domains')` (anonymous `--majora-chart-1`, logged_in `--majora-chart-2`).
- `DomainsChartTooltip.jsx` + helper (same split as `VisitorsChartTooltip`): domain, group, visible counts, total,
  logged-in share (hidden when fewer than 2 series visible or share is `null`).
- Re-export `DomainsChart` from the lazy `charts/index.js`.
- Specs: chart smoke tests (empty, single-row, normal), helper and tooltip specs.

## Files to Change
- `SS/charts/DomainsChart.jsx`, `SS/charts/helpers/DomainsChartHelper.jsx` — new
- `SS/charts/DomainsChartTooltip.jsx`, `SS/charts/helpers/DomainsChartTooltipHelper.jsx` — new
- `SS/charts/index.js` — add re-export
- `SPEC/charts/DomainsChartSpec.js`, `SPEC/charts/helpers/DomainsChartHelperSpec.js`,
  `SPEC/charts/DomainsChartTooltipSpec.js`, `SPEC/charts/helpers/DomainsChartTooltipHelperSpec.js` — new

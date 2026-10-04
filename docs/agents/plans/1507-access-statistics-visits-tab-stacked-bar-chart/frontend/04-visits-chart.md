# VisitsChart and VisitsChartHelper

Add the stacked bar chart to the lazy charts chunk, following the `TimeSeriesChart` /
`TimeSeriesChartHelper` layering and the shared Recharts conventions.

- `charts/VisitsChart.jsx`: props `{ points, series }`. Renders
  `<div data-testid="statistics-visits-chart"><ResponsiveContainer width="100%" height={300}>{VisitsChartHelper.render(points, { series })}</ResponsiveContainer></div>`.
- `charts/helpers/VisitsChartHelper.jsx`:
  - `static render(points, { series })` returns a `BarChart data={points}` in this order:
    `CartesianGrid stroke="var(--majora-chart-grid)"`, `XAxis dataKey="label"` and
    `YAxis allowDecimals={false}` (both `stroke="var(--majora-chart-axis)"`),
    `Tooltip content={<VisitsChartHelper.Tooltip series={series} />}` (or an equivalent render
    function), `Legend`, then one `Bar` per visible series in stack order (`anonymous` first, so
    it is at the bottom; then `logged_in`), each with `stackId="visits"`,
    `isAnimationActive={false}`, the translated `name`, and `fill` `var(--majora-chart-1)` for
    anonymous / `var(--majora-chart-2)` for logged-in. Keep the series → color/label mapping in a
    private constant.
  - The tooltip content (reading `payload[0].payload`, rendering nothing when inactive or empty):
    `StatisticsBucketFormatter.range(start, end)`; one line per visible series plus the total
    (`visits.total`); and the `visits.logged_in_share` line with `StatisticsBucketFormatter.percent`
    only when both series are visible and `loggedInShare !== null`. Use Bootstrap utility classes
    on a small card (`bg-body border rounded p-2 small`) so it works in both themes.
- Re-export `VisitsChart` from `charts/index.js` next to `TimeSeriesChart`.

## Files to Change

- `frontend/assets/js/components/resources/staff_statistics/charts/VisitsChart.jsx` — new.
- `frontend/assets/js/components/resources/staff_statistics/charts/helpers/VisitsChartHelper.jsx`
  — new.
- `frontend/assets/js/components/resources/staff_statistics/charts/index.js` — add
  `export { default as VisitsChart } from './VisitsChart.jsx';`.
- `frontend/specs/assets/js/components/resources/staff_statistics/charts/VisitsChartSpec.js` —
  smoke tests with `renderToStaticMarkup`: the wrapper renders for empty, single-point and normal
  data, with one and with two series.
- `frontend/specs/assets/js/components/resources/staff_statistics/charts/helpers/VisitsChartHelperSpec.js`
  — `render` returns a `BarChart` with the expected `Bar` children per series set (inspect the
  element tree: `stackId`, `fill`, order). Tooltip content: inactive → null; single-date and range
  headers; hidden series omitted; share shown for `all` with a non-zero total, hidden when the
  total is 0 or only one series is visible.

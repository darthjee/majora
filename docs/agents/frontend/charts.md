## Charts

Charts use **Recharts 3** (`recharts` in `frontend/package.json`, added with
`docker-compose run --rm majora_fe yarn add recharts`). The first consumer is the staff
access statistics page; which tab draws which chart is documented in
[statistics.md](../statistics.md). Follow these conventions for any new chart.

## Lazy loading

Recharts is large, so only chart components live in a lazy chunk:

- a `charts/index.js` re-exports every chart as a named export
  (`export { default as VisitsChart } from './VisitsChart.jsx';`);
- one shared wrapper owns the single `React.lazy` entry into that file and maps the named
  exports to one component, so every chart of the feature shares one chunk. For the
  statistics page this is `pages/elements/StaffStatisticsCharts.jsx`, rendered as
  `<StaffStatisticsCharts chart="VisitsChart" ...chartProps />`;
- the wrapper renders `<Suspense fallback={<LoadingMessage ... />}>`
  (`components/common/misc/LoadingMessage.jsx`);
- pages, controllers and other elements stay in the main bundle; pages never call
  `React.lazy` themselves.

## Sizing

Each chart component wraps a `<ResponsiveContainer width="100%" height={300}>` (fluid width,
fixed height) in a `<div data-testid="<feature>-<name>-chart">` that it owns. A chart whose
row count varies may compute its height instead (e.g. the horizontal `DomainsChart` uses
`Math.max(300, rows.length * 32 + 60)`).

## Structure

Charts follow the [component architecture](component-architecture.md) split:

- **Controller** (`.js`, no JSX): one per page, not per chart. It fetches through
  `RequestStore.ensure` (endpoints in the resource config) and a static `map()` turns the
  response into flat, ready-to-plot points, oldest first, plus labels, shares and the series
  to draw. Extra fields used by tooltips are kept on each point and read from
  `entry.payload`. Unit-tested with fake setters.
- **Helper** (`charts/helpers/<Name>ChartHelper.jsx`): a pure `render(points, options)`
  returning the Recharts tree. Shared shapes get shared helpers (e.g.
  `MetricLineChartHelper`, `TimeSeriesChartHelper`).
- **Tooltip:** custom tooltips use the same split, a `<Name>ChartTooltip.jsx` that returns
  `null` when inactive or with an empty payload, and a `<Name>ChartTooltipHelper.jsx` that
  renders the content.

The chart component itself (`charts/<Name>Chart.jsx`) only renders the `data-testid` wrapper,
the `ResponsiveContainer` and the helper's output.

**Composition order:** `CartesianGrid`, axes, `Tooltip`, `Legend` (only with more than one
series), series (`Line` / `Bar` / `Area`), then markers. Use `isAnimationActive={false}`, and `dot={false}` on dense series. Format
dates and numbers with `Intl.DateTimeFormat` / `Intl.NumberFormat` in the browser locale and
time zone.

## Colors

Colors are CSS variables, passed as `stroke="var(--majora-chart-1)"` / `fill=...`, never
class names. A `:root` block in `frontend/assets/css/main.scss` declares
the palette:

| Variable | Value |
|---|---|
| `--majora-chart-1` | `$secondary-color` (#6b48a0) |
| `--majora-chart-2` | `$primary-color` (#3a3a5c) |
| `--majora-chart-3` | #2a9d8f (teal) |
| `--majora-chart-4` | #e9a23b (amber) |
| `--majora-chart-5` | #d1495b (rose) |
| `--majora-chart-6` | #5c7cba (slate blue) |
| `--majora-chart-grid` | #dee2e6 |
| `--majora-chart-axis` | #6c757d |

Named series (key, color, label prefix) live in one place per feature, e.g.
`staff_statistics/charts/helpers/chartSeries.js` (`AUDIENCE_SERIES` uses chart-1 / chart-2,
`NEW_RETURNING_SERIES` chart-3 / chart-4).

## Testing

Jasmine runs in plain Node and renders with `renderToStaticMarkup` (no DOM, no layout), so
`ResponsiveContainer` never measures anything. Recharts 3 renders under Node without a
`ResizeObserver`, so no stub is needed.

- Chart components get **smoke tests only**: import the component directly (not through the
  lazy chunk) and assert the `data-testid` wrapper renders for empty, single-point and normal
  data.
- The real logic is tested in controllers and pure helpers. Helper specs inspect the
  returned element tree (root type, child order, props such as `dataKey` and `stroke`).
- Page specs that render the lazy wrapper must accept either the `Suspense` fallback or the
  chart wrapper: React caches the resolved lazy module, and spec order is random. The lazy
  wrapper's own spec awaits the `charts/index.js` import and `flushMicrotasks`
  (`specs/support/flushMicrotasks.js`) before asserting the chart renders.

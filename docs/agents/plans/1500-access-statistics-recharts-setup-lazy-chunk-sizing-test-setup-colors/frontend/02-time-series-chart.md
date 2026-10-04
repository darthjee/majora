# Generic TimeSeriesChart and chunk entry

Create the reusable reference chart, following the spec's three-layer layout (this issue has no controller; tabs add theirs).

- `charts/helpers/TimeSeriesChartHelper.jsx`: a pure `render(points, { xKey, series })` returning `<LineChart data={points}>` with this composition order: `CartesianGrid` (`stroke="var(--majora-chart-grid)"`) → `XAxis dataKey={xKey}` / `YAxis` (axis stroke `var(--majora-chart-axis)`) → `Tooltip` → one `<Line>` per series entry `{ dataKey, color, label }` with `type="monotone"`, `stroke={color}` (a CSS variable string such as `var(--majora-chart-1)`), `name={label}`, `isAnimationActive={false}`, `dot={false}`. Add `Legend` only when there is more than one series.
- `charts/TimeSeriesChart.jsx`: props `{ name, points, xKey, series }`. Renders `<div data-testid={`statistics-${name}-chart`}>` wrapping `<ResponsiveContainer width="100%" height={300}>` around the helper's tree. Document the props with JSDoc like the other components.
- `charts/index.js`: the lazy chunk entry. It re-exports every chart as named exports (`export { default as TimeSeriesChart } from './TimeSeriesChart.jsx';`). Later tabs add their charts here.
- Smoke specs, importing the component directly (not via `index.js`): render with `renderToStaticMarkup` and assert the `data-testid="statistics-<name>-chart"` wrapper is in the markup for empty `[]`, single-point and normal (several points, two series) data. Add a small spec for the helper that it returns a `LineChart` element with one `Line` child per series, in the stated order.
- If importing or rendering Recharts under Node throws because `ResizeObserver` is missing, add `frontend/specs/support/resizeObserverStub.js`. It only defines `globalThis.ResizeObserver` (a class with no-op `observe`/`unobserve`/`disconnect`) when it is undefined. Register it with an extra `--helper=specs/support/resizeObserverStub.js` in both the `test` and `coverage` scripts in `package.json`, like `preloadTranslations.js`. Skip this if the specs pass without it.

## Files to Change
- `frontend/assets/js/components/resources/staff_statistics/charts/TimeSeriesChart.jsx`: new
- `frontend/assets/js/components/resources/staff_statistics/charts/helpers/TimeSeriesChartHelper.jsx`: new
- `frontend/assets/js/components/resources/staff_statistics/charts/index.js`: new lazy chunk entry
- `frontend/specs/assets/js/components/resources/staff_statistics/charts/TimeSeriesChartSpec.js`: new smoke spec
- `frontend/specs/assets/js/components/resources/staff_statistics/charts/helpers/TimeSeriesChartHelperSpec.js`: new
- `frontend/specs/support/resizeObserverStub.js` + `frontend/package.json` scripts: only if needed

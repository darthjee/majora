# Shared lazy wrapper mounted on the Visitors tab

Create `pages/elements/StaffStatisticsCharts.jsx`, the only `React.lazy` entry into the charts chunk:

- At module scope: `const Charts = React.lazy(() => import('../../charts/index.js'));`. Because `index.js` uses named exports, map to a component: the lazy factory resolves `{ default: function LazyChart({ chart, ...props }) { const Chart = module[chart]; return <Chart {...props} />; } }`, or an equivalent that keeps one shared chunk.
- Component props: `{ chart, ...chartProps }` where `chart` is the export name (e.g. `'TimeSeriesChart'`). It renders `<Suspense fallback={<LoadingMessage message={Translator.t('staff_statistics_page.charts_loading')} />}>` around the lazy component.
- JSDoc as for the other elements.

Mount it on the Visitors tab: in `StaffStatisticsVisitors.jsx`, keep `<StaffStatisticsPlaceholder />` and add `<StaffStatisticsCharts chart="TimeSeriesChart" name="visitors" points={[]} xKey="date" series={[{ dataKey: 'visitors', color: 'var(--majora-chart-1)', label: Translator.t('staff_statistics_page.tabs.visitors') }]} />` below it. #1510 later replaces both.

Specs:
- `StaffStatisticsChartsSpec.js`: under `renderToStaticMarkup` it renders the loading fallback (charts loading text), and it doesn't throw for a valid `chart` name.
- Update `StaffStatisticsPagesSpec.js` if its Visitors expectations break (the page now also shows the loading fallback).

## Files to Change
- `frontend/assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsCharts.jsx`: new lazy wrapper
- `frontend/assets/js/components/resources/staff_statistics/pages/StaffStatisticsVisitors.jsx`: mount the reference chart through the wrapper
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsChartsSpec.js`: new
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/StaffStatisticsPagesSpec.js`: adjust if needed

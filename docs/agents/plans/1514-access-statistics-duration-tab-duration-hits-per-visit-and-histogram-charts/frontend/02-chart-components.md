# Chart components
Add the three charts and their tooltips to the lazy charts chunk. Each chart is a thin component: a `data-testid` wrapper plus `<ResponsiveContainer width="100%" height={300}>`. Each delegates to a helper whose `render(...)` returns the Recharts tree. Use the composition order of the existing helpers (grid, axes, tooltip, legend, series), `AXIS_STROKE = 'var(--majora-chart-axis)'`, `CartesianGrid stroke="var(--majora-chart-grid)"` and `isAnimationActive={false}`.

**`DurationChart`** (`statistics-duration-chart`): `LineChart data={points}` with:
- `XAxis dataKey="label"`;
- `YAxis tickFormatter={StatisticsDurationFormatter.format}`;
- `Tooltip content={<DurationChartTooltip mode="duration" />}` and a `Legend`;
- two `Line`s, `type="monotone"`, `connectNulls={false}`, with a small dot: `average_duration_seconds` (`var(--majora-chart-1)`, name `t('average_duration')`) and `median_duration_seconds` (`var(--majora-chart-2)`, name `t('median_duration')`).

**`HitsPerVisitChart`** (`statistics-hits-per-visit-chart`): the same structure, with:
- `average_hits` and `median_hits` (names `t('average_hits')` and `t('median_hits')`);
- a `YAxis` `tickFormatter` that uses `Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })`. Add it as `StatisticsBucketFormatter.decimal(value, locale)`, with a spec;
- tooltip `mode="hits"`.

**`DurationChartTooltip`** with **`DurationChartTooltipHelper`**: shared by both line charts and modelled on `VisitorsChartTooltip`. It returns `null` while inactive or when there is no payload. The card (`data-testid="statistics-duration-tooltip"`) shows:
- `StatisticsBucketFormatter.range(start, end)`;
- the mode's two values. Durations go through `StatisticsDurationFormatter.format`; hits go through `decimal`, with `—` for `null`;
- `visits: count(point.visits)`;
- `single_hit_share: percent(point.singleHitShare)`, hidden when that is `null`.

**`DurationHistogramChart`** (`statistics-duration-histogram-chart`) with **`DurationHistogramChartHelper`**: `BarChart` over `bins`, with:
- each bin mapped at render time to add `label: Translator.t(`staff_statistics_page.duration.bins.${labelKey}`)`;
- `XAxis dataKey="label"`, `YAxis allowDecimals={false}`;
- one `Bar dataKey="count" fill="var(--majora-chart-3)" name={t('visits')}` and no `Legend`;
- `Tooltip content={<DurationHistogramTooltip />}`. The tooltip shows the bin label, `visits: count` and `histogram_share: percent(share)`, hidden when `share` is `null` (`data-testid="statistics-duration-histogram-tooltip"`).

Re-export `DurationChart`, `HitsPerVisitChart` and `DurationHistogramChart` from `charts/index.js`.

**Specs.**
- Smoke tests for each chart component with empty, single-point and normal data, rendering the test id (follow `VisitorsAudienceChartSpec`).
- Helper specs asserting the Recharts tree: line keys, colors, `connectNulls`, the tick formatter, `allowDecimals`, no legend on the histogram, and translated bin labels.
- Tooltip and tooltip-helper specs for both modes: inactive, `null` values, hidden share, and a single-date range.

## Files to Change
- `frontend/assets/js/components/resources/staff_statistics/charts/DurationChart.jsx`: new.
- `frontend/assets/js/components/resources/staff_statistics/charts/HitsPerVisitChart.jsx`: new.
- `frontend/assets/js/components/resources/staff_statistics/charts/DurationHistogramChart.jsx`: new.
- `frontend/assets/js/components/resources/staff_statistics/charts/DurationChartTooltip.jsx`: new.
- `frontend/assets/js/components/resources/staff_statistics/charts/DurationHistogramTooltip.jsx`: new.
- `frontend/assets/js/components/resources/staff_statistics/charts/helpers/DurationChartHelper.jsx`: new.
- `frontend/assets/js/components/resources/staff_statistics/charts/helpers/HitsPerVisitChartHelper.jsx`: new.
- `frontend/assets/js/components/resources/staff_statistics/charts/helpers/DurationHistogramChartHelper.jsx`: new.
- `frontend/assets/js/components/resources/staff_statistics/charts/helpers/DurationChartTooltipHelper.jsx`: new.
- `frontend/assets/js/components/resources/staff_statistics/charts/helpers/DurationHistogramTooltipHelper.jsx`: new.
- `frontend/assets/js/components/resources/staff_statistics/charts/index.js`: three re-exports.
- `frontend/assets/js/components/resources/staff_statistics/pages/helpers/StatisticsBucketFormatter.js`: `decimal(value, locale)`.
- `frontend/specs/assets/js/components/resources/staff_statistics/charts/` (and `charts/helpers/`): one spec per new file.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/helpers/StatisticsBucketFormatterSpec.js`: `decimal` cases (create the file if it does not exist).

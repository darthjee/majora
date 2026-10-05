# Page, body and tab helper
Wire the page to the controller and charts, replacing the placeholder.

**Page.** `pages/StaffStatisticsDuration.jsx` becomes `StaffStatisticsAccessGate` > `StaffStatisticsDurationBody`, like `StaffStatisticsVisitors.jsx`.

**Body.** `pages/elements/StaffStatisticsDurationBody.jsx` is a copy of `StaffStatisticsVisitorsBody`. It uses `DurationController`, `StaffStatisticsShell tab="duration" resolvedGranularity={data?.granularity}`, and `StaffStatisticsDurationHelper.renderState({ data, loading, error })`.

**Helper.** `pages/helpers/StaffStatisticsDurationHelper.jsx`:
- `renderState` renders loading (`LoadingMessage` with `charts_loading`), the error (`ErrorAlert`), or `render(data)`.
- `render(data)` returns `<section data-testid="statistics-duration">`, containing:
  - an `h2` with `t('title')`;
  - the totals row: `StatisticsKpiTile`s for visits (`count`), average and median duration (`StatisticsDurationFormatter.format`), average hits (`decimal`, `—` when `null`), and a single-hit share tile shown only when `totals.visits > 0`. Test ids are `statistics-duration-<key>`;
  - the empty note (`data-testid="statistics-duration-empty"`) when `data.empty` is true;
  - three `h3`s, `duration_chart`, `hits_chart` and `histogram_chart`, each followed by `<StaffStatisticsCharts chart="DurationChart" points={data.points} />`, `chart="HitsPerVisitChart" points=...` and `chart="DurationHistogramChart" bins={data.bins}` respectively. The charts are drawn even when the range is empty.

**Specs.**
- A body spec (stub `buildEffect`, as in `StaffStatisticsVisitorsBodySpec`).
- A helper spec covering loading, error, normal, empty (note shown, share tile hidden, charts still rendered) and `null` averages (`—`).
- In `StaffStatisticsPagesSpec.js`, add `StaffStatisticsDuration: 'staff_statistics_page.charts_loading'` to `LOADING_KEYS`, and `stubBuildEffect(DurationController)` with its import.

## Files to Change
- `frontend/assets/js/components/resources/staff_statistics/pages/StaffStatisticsDuration.jsx`: render the body instead of the placeholder.
- `frontend/assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsDurationBody.jsx`: new.
- `frontend/assets/js/components/resources/staff_statistics/pages/helpers/StaffStatisticsDurationHelper.jsx`: new.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsDurationBodySpec.js`: new.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/helpers/StaffStatisticsDurationHelperSpec.js`: new.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/StaffStatisticsPagesSpec.js`: Duration now shows the loading state.

# Wire the Visitors tab page

- `pages/StaffStatisticsVisitors.jsx`: replace the placeholder with `<StaffStatisticsAccessGate><StaffStatisticsVisitorsBody /></StaffStatisticsAccessGate>`, like `StaffStatisticsVisits.jsx`.
- `pages/elements/StaffStatisticsVisitorsBody.jsx`: same as `StaffStatisticsVisitsBody`, with `VisitorsController`, `tab="visitors"` and `resolvedGranularity={data?.granularity}` (the filter bar shows the granularity control by default).
- `pages/helpers/StaffStatisticsVisitorsHelper.jsx`: `renderState` (loading → `LoadingMessage` with `charts_loading`, error → `ErrorAlert`) and `render(data)` producing `<section data-testid="statistics-visitors">` with:
  1. `h2` `visitors.title`;
  2. a `row` of `StatisticsKpiTile`s without `href` (`Intl.NumberFormat` via `StatisticsBucketFormatter.count`): unique visitors, new, returning (with a secondary line `returning_share` + `percent(returning / unique)`, omitted when unique is 0), and anonymous / logged-in only for the series in `audienceSeries`; test ids `statistics-visitors-<key>`;
  3. the `totals_note` and `first_visit_note` lines (`text-muted small`);
  4. the empty note (`visitors.empty`, `data-testid="statistics-visitors-empty"`) when `data.empty`;
  5. `h3` `new_returning_title` + `<StaffStatisticsCharts chart="VisitorsNewReturningChart" points={data.points} />`, then `h3` `audience_title` + `<StaffStatisticsCharts chart="VisitorsAudienceChart" points={data.points} series={data.audienceSeries} />` (both drawn even when empty).
- Specs: helper specs for every state, the hidden returning share at zero, each audience (hidden tile), the empty note; extend `StaffStatisticsPagesSpec` so the Visitors page no longer expects the placeholder.

## Files to Change
- `frontend/assets/js/components/resources/staff_statistics/pages/StaffStatisticsVisitors.jsx` — real page.
- `frontend/assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsVisitorsBody.jsx` — new.
- `frontend/assets/js/components/resources/staff_statistics/pages/helpers/StaffStatisticsVisitorsHelper.jsx` — new.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/helpers/StaffStatisticsVisitorsHelperSpec.js` — new.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/StaffStatisticsPagesSpec.js` — update the Visitors expectations.

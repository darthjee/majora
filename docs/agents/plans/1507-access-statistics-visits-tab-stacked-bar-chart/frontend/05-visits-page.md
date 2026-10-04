# Wire the Visits page

Replace the placeholder in `pages/StaffStatisticsVisits.jsx` (route `staffStatisticsVisits`).

- Keep `StaffStatisticsAccessGate` outside. Move the body into an inner component (e.g.
  `StaffStatisticsVisitsBody` in the same file or `pages/elements/`) so the data fetch only starts
  once access is confirmed. It holds `data` / `loading` / `error` state, builds `VisitsController`
  with `useMemo`, and runs `useEffect(() => controller.buildEffect()(), [controller])`.
- Render `StaffStatisticsShell tab="visits" resolvedGranularity={data?.granularity}` around:
  - loading → `LoadingMessage`;
  - error → `ErrorAlert` (`components/common/misc/ErrorAlert.jsx`) with the error message;
  - otherwise a `pages/helpers/StaffStatisticsVisitsHelper.jsx` (pure render) that draws:
    a `visits.title` heading; the totals line (total, then anonymous / logged-in following
    `series`, values via `StatisticsBucketFormatter.count`); the `visits.empty` note when
    `data.empty` (the chart is still drawn); and
    `<StaffStatisticsCharts chart="VisitsChart" points={data.points} series={data.series} />`.
- Add `data-testid` hooks for the totals line (`statistics-visits-totals`) and the empty note
  (`statistics-visits-empty`) for specs.

## Files to Change

- `frontend/assets/js/components/resources/staff_statistics/pages/StaffStatisticsVisits.jsx` —
  real page replacing `StaffStatisticsPlaceholder`.
- `frontend/assets/js/components/resources/staff_statistics/pages/helpers/StaffStatisticsVisitsHelper.jsx`
  — new pure render helper (totals line, empty note, chart).
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/StaffStatisticsPagesSpec.js`
  — the shared "renders the placeholder" example no longer applies to Visits. Exclude Visits from
  the placeholder table, or assert the shell plus the loading state for it.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/helpers/StaffStatisticsVisitsHelperSpec.js`
  — totals line for each audience (hidden counts not shown), empty note shown only when empty,
  and the chart entry rendered (accept the `charts_loading` fallback or the chart wrapper).

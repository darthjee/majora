# Page wiring

- `StaffStatisticsDomainsBody.jsx`: `<StaffStatisticsShell tab="domains" showGranularity={false}>`, runs
  `DomainsController` via `useMemo` + `useEffect(controller.buildEffect())`, reads filters via
  `StaffStatisticsFiltersController.currentFilters()` for row links.
- `StaffStatisticsDomainsHelper.jsx`: `renderState({ data, loading, error }, filters)` — loading, error, empty
  states; totals line (visits, visible audience tiles, unique visitors, avg / median duration) with
  `StatisticsKpiTile`; `<StaffStatisticsCharts chart="DomainsChart" .../>`; the table.
- `StaffStatisticsDomains.jsx`: replace the placeholder with AccessGate > `StaffStatisticsDomainsBody`.
- `StaffStatisticsPagesSpec.js`: `stubBuildEffect(DomainsController)` and add Domains to `LOADING_KEYS`.

## Files to Change
- `SS/pages/StaffStatisticsDomains.jsx` — replace placeholder
- `SS/pages/elements/StaffStatisticsDomainsBody.jsx` — new
- `SS/pages/helpers/StaffStatisticsDomainsHelper.jsx` — new
- `SPEC/pages/elements/StaffStatisticsDomainsBodySpec.js`, `SPEC/pages/helpers/StaffStatisticsDomainsHelperSpec.js` — new
- `SPEC/pages/StaffStatisticsPagesSpec.js` — update

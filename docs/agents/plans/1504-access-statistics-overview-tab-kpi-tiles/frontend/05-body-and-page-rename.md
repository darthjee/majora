# Body element and page rename

- Create `elements/StaffStatisticsOverviewBody.jsx`, mirroring `StaffStatisticsVisitsBody.jsx`. It holds `useState` for data, loading and error, plus `useMemo(() => new OverviewController(...))` and `useEffect(() => controller.buildEffect()(), [controller])`, and renders `<StaffStatisticsShell tab="overview" showGranularity={false}>{StaffStatisticsOverviewHelper.renderState(...)}</StaffStatisticsShell>`. It reads the filters for the tile links with `useMemo(() => StaffStatisticsFiltersController.currentFilters(), [])` and passes them to the helper (extend `renderState`'s argument with `filters`).
- Rename `pages/StaffStatistics.jsx` to `pages/StaffStatisticsOverview.jsx` (`git mv`) and rename the component to `StaffStatisticsOverview`. Its body becomes `<StaffStatisticsAccessGate><StaffStatisticsOverviewBody /></StaffStatisticsAccessGate>`. Drop the `StaffStatisticsPlaceholder` and `StaffStatisticsShell` imports from it.
- In `AppHelper.jsx`, update the import and keep the `staffStatistics` route key, now mapped to `<StaffStatisticsOverview />`.
- Update the existing specs that import the old page: in `StaffStatisticsPagesSpec.js`, rename the `PAGES` row and also `stubBuildEffect(OverviewController)`; update `AppHelperSpec/staffStatisticsRoutesSpec.js`. Run `grep -rn "StaffStatistics.jsx\|StaffStatistics\b" frontend/` to catch any other reference, docs included (e.g. `docs/agents/specs/access-statistics/shared-infrastructure.md`, if it names the old file).

## Files to Change

- `frontend/assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsOverviewBody.jsx` (new).
- `frontend/assets/js/components/resources/staff_statistics/pages/StaffStatistics.jsx` → `frontend/assets/js/components/resources/staff_statistics/pages/StaffStatisticsOverview.jsx` (renamed and rewritten).
- `frontend/assets/js/components/helpers/AppHelper.jsx`: import and route map.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsOverviewBodySpec.js` (new): mirror `StaffStatisticsVisitsBodySpec.js`.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/StaffStatisticsPagesSpec.js`: renamed page and `OverviewController` stub.
- `frontend/specs/assets/js/components/helpers/AppHelperSpec/staffStatisticsRoutesSpec.js`: renamed page.

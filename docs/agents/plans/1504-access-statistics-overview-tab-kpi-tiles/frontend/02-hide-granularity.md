# Hide granularity on demand

Granularity is irrelevant on Overview (spec "Filters"). Add a `showGranularity` prop (default `true`) to `StaffStatisticsFilterBar`, pass it into the helper state, and make `StaffStatisticsFilterBarHelper.render` skip the granularity select when it is `false`. `StaffStatisticsShell` gets the same prop (default `true`) and passes it through. The `granularity` URL param is never touched: the controller keeps carrying it in `statisticsHref`, so it survives a switch to another tab.

## Files to Change

- `frontend/assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsFilterBar.jsx`: new prop, forwarded in the helper state, plus JSDoc.
- `frontend/assets/js/components/resources/staff_statistics/pages/elements/helpers/StaffStatisticsFilterBarHelper.jsx`: render the granularity select only when `state.showGranularity !== false`.
- `frontend/assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsShell.jsx`: new prop forwarded to the filter bar, plus JSDoc.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsFilterBarSpec.js`, `frontend/specs/assets/js/components/resources/staff_statistics/pages/elements/helpers/` (filter bar helper spec) and `frontend/specs/assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsShellSpec.js`: cover hidden and shown (default) granularity, and the prop pass-through.

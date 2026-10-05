# Wire the Users tab body and page

- `StaffStatisticsUsersBody.jsx`: same shape as `StaffStatisticsDomainsBody.jsx`. It holds the
  data / loading / error state, runs `UsersController`, reads the filters with
  `StaffStatisticsFiltersController.currentFilters()`, and renders
  `<StaffStatisticsShell tab="users" showGranularity={false}>`.
- `StaffStatisticsUsersHelper.jsx` `renderState({ data, loading, error }, filters)`:
  - loading → `LoadingMessage`;
  - error → the shared error message the other tabs use;
  - empty on page 1 → the `users.empty` note only;
  - empty with `page > 1` → the note plus the pagination;
  - otherwise → `StatisticsUsersTable` plus the pagination.
- **Pagination**: the shared `Pagination` with `currentPage`, `totalPages`, `perPage`,
  `basePath="#/staff/statistics/users"` and `extraParams` = the current filters with defaults
  dropped (same rule as `statisticsHref`) plus `sort` when it is not the default.
- `StaffStatisticsUsers.jsx`: replace the placeholder with
  `<StaffStatisticsAccessGate><StaffStatisticsUsersBody /></StaffStatisticsAccessGate>`.
- Specs: the body and the helper (every state, pagination params), and update
  `StaffStatisticsPagesSpec.js` for the Users page no longer rendering the placeholder.

## Files to Change

- `frontend/assets/js/components/resources/staff_statistics/pages/StaffStatisticsUsers.jsx` — render the body.
- `frontend/assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsUsersBody.jsx` — new.
- `frontend/assets/js/components/resources/staff_statistics/pages/helpers/StaffStatisticsUsersHelper.jsx` — new.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsUsersBodySpec.js` — new.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/helpers/StaffStatisticsUsersHelperSpec.js` — new.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/StaffStatisticsPagesSpec.js` — Users page case.

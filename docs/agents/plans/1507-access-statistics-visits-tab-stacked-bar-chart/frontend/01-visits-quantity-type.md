# Add the `visits` quantity type

Register the Visits endpoint in the staff statistics request config, mirroring `domains`. It is
staff-only, has no restricted/full variant (`regular` and `private` point at the same object) and
`permission: null`. Update the file's JSDoc to mention `GET.visits`.

## Files to Change

- `frontend/assets/js/utils/requests/config/staffStatisticsConfig.js` — add
  `const visits = { path: () => '/staff/statistics/visits.json', permission: null };` and
  `visits: { regular: visits, private: visits }` under `GET`.
- `frontend/specs/assets/js/utils/requests/resourceConfigStaffStatisticsSpec.js` — cover the new
  `visits` entry (path and both variants), following the existing `domains` examples.

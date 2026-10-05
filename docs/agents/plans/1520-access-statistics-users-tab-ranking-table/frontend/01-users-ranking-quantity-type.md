# Add the usersRanking quantity type

Register the Users endpoint with RequestStore, like `domainsSummary`.

- Add `const usersRanking = { path: () => '/staff/statistics/users.json', permission: null };`
  and `GET.usersRanking: { regular: usersRanking, private: usersRanking }`.
- Extend the file's JSDoc with a `GET.usersRanking` sentence (issue #1520, paginated plain array
  of user rows, `sort` query param) and add it to the list of per-tab quantity types.
- Extend `resourceConfigStaffStatisticsSpec.js` with the new path.

## Files to Change

- `frontend/assets/js/utils/requests/config/staffStatisticsConfig.js` — new quantity type.
- `frontend/specs/assets/js/utils/requests/resourceConfigStaffStatisticsSpec.js` — cover it.

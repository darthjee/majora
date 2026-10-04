# RequestStore resource and StatisticsQuery

Implement the **RequestStore** section of `docs/agents/specs/access-statistics/shared-infrastructure.md`.

- Add `utils/requests/config/staffStatisticsConfig.js`, modelled on `staffUserConfig.js`
  (JSDoc header explaining the resource): `const domains = { path: () =>
  '/staff/statistics/domains.json', permission: null };` and
  `export default { GET: { domains: { regular: domains, private: domains } } };`.
- Register it as `staffStatistics` in `RESOURCES` in `utils/requests/resourceConfig.js`
  (after `staffPhoto`) and add `'staffStatistics'` to the resource-name JSDoc list there.
  **No** entry in `RequestPermissionResolvers.js`.
- Add `pages/helpers/StatisticsQuery.js`: `StatisticsQuery.fromHash(resolver = new
  HashRouteResolver(), today?)` reads `getFilterParams()`, normalizes via
  `StatisticsFilters.fromParams`, resolves `range` to `from` / `to` with
  `StatisticsFilters.resolveDates`, drops `range`, omits defaults/"any" (`granularity=auto`,
  `audience=all`, no `user` / `domain`), and adds `tz` from
  `Intl.DateTimeFormat().resolvedOptions().timeZone` (injectable for tests). `from` / `to` /
  `tz` are always present.

## Files to Change

- `frontend/assets/js/utils/requests/config/staffStatisticsConfig.js` — new.
- `frontend/assets/js/utils/requests/resourceConfig.js` — register `staffStatistics`.
- `frontend/assets/js/components/resources/staff_statistics/pages/helpers/StatisticsQuery.js` — new.

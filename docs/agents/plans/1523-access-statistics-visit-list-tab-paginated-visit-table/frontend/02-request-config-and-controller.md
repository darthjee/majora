# Request config and controller

Add the `visitList` quantity type and the controller that loads and maps it.

- `staffStatisticsConfig.js`: `const visitList = { path: () => '/staff/statistics/visit-list.json', permission: null };`
  registered as `visitList: { regular: visitList, private: visitList }`. Also extend the JSDoc
  paragraph that lists the quantity types (issue #1523).
- `controllers/VisitListController.js`, modeled on `UsersController`:
  - constructor `(setData, setLoading, setError)`, extending `BasePageController`;
  - `buildEffect()` with a mounted guard and `buildSafeSetter`;
  - fetches with `RequestStore.ensure({ componentName: 'VisitListController', resource: 'staffStatistics', quantityType: 'visitList', query: { ...StatisticsQuery.fromHash(), ...sortQuery(sort), ...Object.fromEntries(new HashRouteResolver().getPaginationParams()) } })`,
    where `sort` comes from `visitListSort.currentSort()`;
  - on error, sets `Translator.t('staff_statistics_page.visit_list.load_error')`;
  - `static map(rows, pagination, sort)` returns `{ rows, page, pages, perPage, sort, empty }`
    (same defaults as Users: `page = 1`, `pages = 1`). Each row is
    `{ id, startedAt, lastSeenAt, durationSeconds, hits, ongoing, ip, domain, sessionId, user }`,
    where `domain` is the hostname, or `visit_list.unknown_domain` when `domain.id === 'unknown'`,
    and `user` is `{ id, name, displayName, email }` or `null`.

## Files to Change

- `frontend/assets/js/utils/requests/config/staffStatisticsConfig.js` — `visitList` quantity type.
- `controllers/VisitListController.js` — new.

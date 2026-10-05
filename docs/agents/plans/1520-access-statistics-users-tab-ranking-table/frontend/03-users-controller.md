# Add the UsersController

Model it on `DomainsController.js` (`BasePageController`, `buildEffect`, `buildSafeSetter`,
late responses dropped), with the pagination of `StaffUsersController.js`.

- Constructor `(setData, setLoading, setError)`.
- `RequestStore.ensure({ componentName: 'UsersController', resource: 'staffStatistics',
  quantityType: 'usersRanking', query: { ...StatisticsQuery.fromHash(),
  ...sortQuery(currentSort()), ...Object.fromEntries(new HashRouteResolver().getPaginationParams()) } })`.
- `static map(rows, pagination, sort)` returns `{ rows, page, pages, perPage, sort, empty }`.
  Each row is `{ id, name, displayName, email, visits, timeOnSiteSeconds,
  averageDurationSeconds, hits, domains, lastSeenAt }`, where `domains` is a list of labels:
  the hostname, or `Translator.t('staff_statistics_page.users.unknown_domain')` for the
  `id: 'unknown'` entry. `empty` is `rows.length === 0`. Rows keep API order.
- On error, set `staff_statistics_page.users.load_error`.
- Jasmine spec with fake setters (mapping, unknown domain label, pagination, sort and page in
  the query, default sort omitted, error path, unmount drops the response).

## Files to Change

- `frontend/assets/js/components/resources/staff_statistics/pages/controllers/UsersController.js` — new.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/controllers/UsersControllerSpec.js` — new.

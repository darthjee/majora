# Frontend Plan: Access statistics: Users tab (ranking table)

Main plan: [plan.md](plan.md)

## Shared contracts

- Relies on the translator's `staff_statistics_page.users.*` keys
  ([plan.md](plan.md#i18n-keys)).
- Consumes `GET /staff/statistics/users.json` as described in
  [plan.md](plan.md#api-already-shipped-by-1519).

## Steps

- [01 — Add the usersRanking quantity type](frontend/01-users-ranking-quantity-type.md)
- [02 — Add the usersSort helper](frontend/02-users-sort-helper.md)
- [03 — Add the UsersController](frontend/03-users-controller.md)
- [04 — Add the StatisticsUsersTable](frontend/04-users-table.md)
- [05 — Wire the Users tab body and page](frontend/05-users-body-and-page.md)

## CI Checks

- `frontend`: `docker-compose run --rm frontend yarn test` (CI job: `jasmine`).
- `frontend`: `docker-compose run --rm frontend npm run lint` (CI job: `frontend-checks`).

## Notes

- Use the Domains tab (#1517) files as the reference for structure, JSDoc and spec style.
- Unlike Domains, sorting is **server-side** and lives in the URL (`?sort=`), not in component
  state: every header is a plain link, and there is no ascending toggle.
- `sort` must not be added to `FILTER_KEYS` (`StatisticsFilters.js`), so `statisticsHref`
  keeps dropping it when moving across tabs.
- A sort or page change is a hash change. Check that it remounts the page (as a filter change
  does) and so refetches. If it does not, depend the body's effect on the current hash.

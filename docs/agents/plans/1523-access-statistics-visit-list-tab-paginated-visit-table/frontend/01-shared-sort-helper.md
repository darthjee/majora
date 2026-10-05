# Shared sort helper

Generalize `helpers/usersSort.js` into a factory that each server-sorted tab configures. Keep
the Users tab's behavior and public API unchanged.

- New `helpers/statisticsSort.js` exporting `createStatisticsSort({ path, keys, defaultSort })`.
  It returns a frozen `{ SORT_KEYS, DEFAULT_SORT, currentSort, sortHref, sortQuery }`, with the
  same semantics as today's `usersSort.js`:
  - `currentSort(params = HashQueryParams.parse(getCurrentHash()))`: an unknown, empty or
    missing value falls back to the default.
  - `sortHref(filters, key)`: `statisticsHref(path, filters)` plus `sort=<key>`, except for
    the default. `page` is never carried.
  - `sortQuery(sort)`: `{}` for the default, `{ sort }` otherwise.
- Rewrite `helpers/usersSort.js` as a thin configuration:
  `createStatisticsSort({ path: '/staff/statistics/users', keys: [...], defaultSort: 'visits' })`.
  Re-export the same named exports so every import site (`UsersController`,
  `StaffStatisticsUsersHelper`, `StatisticsUsersTableHelper`) and `usersSortSpec.js` keep
  working untouched.
- New `helpers/visitListSort.js`: the same thin configuration with path
  `/staff/statistics/visit-list`, keys `['started_at', 'last_seen', 'duration', 'hits']` and
  default `started_at`.

## Files to Change

- `helpers/statisticsSort.js` — new factory, moved out of `usersSort.js`.
- `helpers/usersSort.js` — reduced to a factory configuration, with the same exports.
- `helpers/visitListSort.js` — new Visit list configuration.

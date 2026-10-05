# Add the usersSort helper

Pure helpers for the server-side `sort` param.

- Export `SORT_KEYS = ['visits', 'time_on_site', 'average_duration', 'hits', 'last_seen']` and
  `DEFAULT_SORT = 'visits'`.
- `currentSort(params)`: read `sort` from the hash query (`URLSearchParams`, defaulting to the
  current hash, as the other statistics helpers read it). Return it when it is in `SORT_KEYS`,
  otherwise `DEFAULT_SORT` (the shared "invalid client value falls back to the default" rule).
- `sortHref(filters, key)`: `statisticsHref('/staff/statistics/users', filters)` plus
  `sort=<key>`. Drop `sort` for `DEFAULT_SORT`, and never carry `page` (back to page 1).
- `sortQuery(sort)`: `{}` for the default, `{ sort }` otherwise, used by the controller so the
  default request has no `sort` param.
- Jasmine spec covering valid, invalid, empty and missing values and the hrefs (default,
  non-default, with filters).

## Files to Change

- `frontend/assets/js/components/resources/staff_statistics/pages/helpers/usersSort.js` — new.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/helpers/usersSortSpec.js` — new.

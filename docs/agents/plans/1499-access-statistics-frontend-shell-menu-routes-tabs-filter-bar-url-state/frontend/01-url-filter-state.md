# URL filter state helpers

Implement the **URL query state** section of `docs/agents/specs/access-statistics/shared-infrastructure.md`.

- Append `range`, `from`, `to`, `granularity`, `user`, `domain`, `audience` to `FILTER_KEYS`
  in `HashRouteResolver.js`, and refresh the `getFilterParams` JSDoc so it lists every key
  (including the already-missing `category`, `completed`, `session`).
- Add `StatisticsFilters.js` in `components/resources/staff_statistics/pages/helpers/`: the
  single place for the filter defaults and validation. `StatisticsFilters.fromParams(params)`
  reads a `URLSearchParams` (from `getFilterParams()`) into a normalized object
  `{ range, from, to, granularity, user, domain, audience }`, replacing invalid values with
  defaults (`range` ∉ presets → `30d`; `custom` without a valid `YYYY-MM-DD` pair or with
  `from > to` → `30d`; `granularity` ∉ `auto/day/week/month` → `auto`; `user` not a
  positive integer → any; `domain` not a positive integer nor `unknown` → any; `audience`
  ∉ `all/anonymous/logged_in` → `all`). Also export the preset / enum lists and
  `resolveDates(filters, today)` implementing preset-to-date resolution (`7d` → today − 6,
  `30d` → today − 29, `90d` → today − 89, `12m` → (today − 1 year) + 1 day; `to = today`),
  with `today` injectable for tests (default: local date in the browser zone, formatted
  `YYYY-MM-DD` without going through UTC).
- Add `statisticsHref.js`: `statisticsHref(path, filters)` builds ```${path}?${query}``` from a
  filter object, dropping defaults / "any" (and `from` / `to` unless `range=custom`), never
  adding `page`, `per_page` or `sort`; returns bare `path` when nothing remains.

## Files to Change

- `frontend/assets/js/utils/routing/HashRouteResolver.js` — `FILTER_KEYS` + JSDoc.
- `frontend/assets/js/components/resources/staff_statistics/pages/helpers/StatisticsFilters.js` — new.
- `frontend/assets/js/components/resources/staff_statistics/pages/helpers/statisticsHref.js` — new.

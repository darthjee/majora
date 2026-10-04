# Specs and CI checks

Add Jasmine specs mirroring the new files under
`frontend/specs/assets/js/components/resources/staff_statistics/`, and extend the existing
specs for touched shared files.

- **Full unit coverage** (acceptance criterion): `StatisticsFilters` (every invalid value
  falling back, custom without valid pair / `from > to` → `30d`, preset dates incl. `12m` across
  a leap year), `statisticsHref` (defaults omitted, bare path, `from` / `to` only with
  `custom`, no `page`), `StatisticsQuery` (presets resolved, `range` dropped, `tz` added,
  defaults omitted).
- Controllers with fake setters: filters controller (hash writes, reset, custom-date apply
  rule), user-select controller (debounced search, URL-id label, 404 → `#<id>` hint).
- Render specs (`renderToStaticMarkup`): shell order (title, filter bar, tabs, body), tabs
  (active link, hrefs carry filters but not `page`), granularity "Auto (week)" label.
- Existing specs: `HashRouteResolver` (new routes resolve; tab routes win over landing;
  `getFilterParams` exposes the new keys), `accessRouteConfig`, `HeaderNavHelper`,
  `resourceConfig`.
- Run the CI checks: `docker-compose run --rm majora_fe yarn coverage`,
  `docker-compose run --rm majora_fe yarn lint`, `docker-compose run --rm majora_fe yarn check_i18n`.

## Files to Change

- `frontend/specs/assets/js/components/resources/staff_statistics/**` — new specs.
- a new `frontend/specs/assets/js/utils/routing/HashRouteResolverStaffStatisticsSpec.js` (alongside the other per-area `HashRouteResolver*Spec.js` files) — routes + filter keys.
- Existing specs for `accessRouteConfig`, `HeaderNavHelper`, `resourceConfig` — new entries.

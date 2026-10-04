# Frontend Plan: Access statistics: frontend shell (menu, routes, tabs, filter bar, URL state)

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend **consumes** the translation keys produced by the translator (see
[plan.md](plan.md#translation-keys)): `header.nav_staff_statistics` in `common`, and the
`staff_statistics_page` namespace (`title`, `placeholder`, `tabs.*`, `filters.*`). Labels
such as "Auto (week)" are composed in JSX from `filters.granularities.auto` and
`filters.granularities.<resolved>` — no interpolation.

It relies on the merged backend (#1498): `GET /staff/statistics/domains.json` →
`[{ "id": <int>, "domain": <str> }]`, ordered by `domain`, unpaginated; plus the existing
`GET /staff/users.json?search=<text>` (paginated, items with `id`, `name`, `email`) and
`GET /staff/users/<id>.json`.

Contract **produced** for the tab issues (#1504, #1507, #1510, #1514, #1517, #1520, #1523),
which they will build on:

- `<StaffStatisticsShell tab="<tabKey>" resolvedGranularity={string|undefined}>{body}</StaffStatisticsShell>`
  — `tab` is one of `overview`, `visits`, `visitors`, `duration`, `domains`, `users`,
  `visit_list`; `resolvedGranularity` is the response's `filters.granularity` (`day` /
  `week` / `month`), optional.
- `StatisticsQuery.fromHash()` → a plain query object
  `{ from, to, tz, granularity?, user?, domain?, audience? }` for `RequestStore.ensure({ query })`.
- `statisticsHref(path, filters)` → ```${path}?${query}``` (or bare `path` when every filter is
  at its default).
- `staffStatistics` resource in `RESOURCES`; tabs add their own quantity types to
  `staffStatisticsConfig.js`.

## Steps

- [01 — URL filter state helpers](frontend/01-url-filter-state.md)
- [02 — RequestStore resource and StatisticsQuery](frontend/02-request-store.md)
- [03 — Filter bar and user select](frontend/03-filter-bar.md)
- [04 — Tab shell, tab pages and navigation](frontend/04-shell-and-navigation.md)
- [05 — Specs and CI checks](frontend/05-specs-and-ci.md)

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn coverage` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` and
  `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)

## Notes

- The spec (`docs/agents/specs/access-statistics/shared-infrastructure.md`) is authoritative; read its sections rather than inferring defaults.
- Every hash change remounts the page (`AppHelper.render` keys on the hash), so there is no
  in-page filter state: filter changes just set `window.location.hash`.
- Page controllers keep the existing `AccessStore.ensureStaffOrSuperUser()` redirect pattern
  (as `StaffUsersController.js`), on top of the route gates.
- Do not add Recharts or any dependency here (#1500 does that).

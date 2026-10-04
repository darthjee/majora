# Issue: Access statistics: frontend shell (menu, routes, tabs, filter bar, URL state)

## Description

Frontend shell of the staff access statistics page (#1477). The design is fully specced in `docs/agents/specs/access-statistics/shared-infrastructure.md` (#1482); this issue implements its **Navigation and routes**, **Filter bar controls**, **URL query state** and **RequestStore** sections plus the page translations. Read those sections there rather than a copy here.

Dependency #1498 (shared backend, incl. `GET /staff/statistics/domains.json`) is merged.

## Problem

Every statistics tab (#1504, #1507, #1510, #1514, #1517, #1520, #1523) needs the same menu entry, routes, gates, tab nav, filter bar and URL-backed filter state. None of it exists yet, so no tab can be built until the shell lands.

## Expected Behavior

- Staff and superusers see an "Access statistics" / "Estatísticas de acesso" entry in the staff menu (after `staff-photos`); non-staff are gated on all seven routes.
- `#/staff/statistics` (Overview, landing) and the six tab routes render `StaffStatisticsShell`: page title, filter bar, tab nav, then the tab body (a placeholder until each tab issue lands).
- Filters (`range`, `from`, `to`, `granularity`, `user`, `domain`, `audience`) live in the hash query, are omitted when at their default, fall back to defaults when invalid, and carry across tab links; `page` / `per_page` / `sort` do not.
- Reset navigates to the tab path with no query.

## Acceptance criteria

- [ ] Menu entry, routes, gates and shell render for staff; non-staff are gated.
- [ ] Filters round-trip through the URL; switching tabs keeps them and resets pagination.
- [ ] `StatisticsQuery` and `statisticsHref` fully unit-tested (presets, defaults omitted, invalid URL values).
- [ ] Translations present in both languages (`common.yaml` nav key + new `staff_statistics_page` namespace).

## Solution

- **Navigation:** `adminItem('staff-statistics', 'staff/statistics', 'header.nav_staff_statistics')` in `HeaderNavHelper.jsx`; seven routes + keys in `HashRouteResolver.js` (tab routes before the landing route, after `staffPhotos`); `PAGES` entries in `AppHelper.jsx`; one `staffOrSuperuser` gate per key in `accessRouteConfig.js`. No staff-dashboard card.
- **Tab shell:** `StaffStatisticsShell` and `StaffStatisticsTabs` (modelled on `StaffPhotoTabs.jsx`, but hrefs built with `statisticsHref`).
- **Filter bar:** `StaffStatisticsFilterBar` + `StaffStatisticsFiltersController`: date-range presets (`7d`/`30d`/`90d`/`12m`/`custom` with two `Form.Control type="date"`), user select (`staff/users.json?search=`, label for a URL id from `staff/users/<id>.json`, `#<id>` + "deleted user" hint on 404), domain select (`staff/statistics/domains.json`: Any, domains alphabetically, Unknown), audience, granularity, Reset.
- **Resolved granularity:** `StaffStatisticsShell` / the filter bar take an optional `resolvedGranularity` prop and show it next to "Auto" (e.g. "Auto (week)"). Each tab passes its response's `filters.granularity`; the frontend does not duplicate the 31 / 186-day thresholds. Nothing is shown while the prop is absent (placeholder tabs).
- **User select:** a small custom component, with no new dependency: a `Form.Control` text input, a debounced `staff/users.json?search=` fetch, and a react-bootstrap dropdown / list of results showing `name` with `email` as secondary text. Selecting a result writes `?user=<id>`; clearing it removes the param.
- **URL state:** append the seven keys to `FILTER_KEYS` (refresh the `getFilterParams` JSDoc); `statisticsHref(path, filters)` drops defaults and never adds `page=1`.
- **RequestStore:** `staffStatisticsConfig.js` registered in `resourceConfig.js` with the `domains` quantity type, `permission: null`, same variant for `regular` / `private`, no `RequestPermissionResolvers.js` entry; `StatisticsQuery.fromHash()` resolves presets to `from` / `to` in the browser zone and adds `tz`.
- **Layout:** `components/resources/staff_statistics/pages/{,controllers,helpers,elements}` per the spec; specs mirrored under `frontend/specs/...`.

## Out of scope

- Recharts, the lazy chart chunk and chart colors (#1500).
- Tab endpoints and tab content (#1503 to #1523).

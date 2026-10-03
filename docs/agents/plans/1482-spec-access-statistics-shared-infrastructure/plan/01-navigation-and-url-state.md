# Navigation and URL query state

Fill the page's "Navigation" and "URL query state" items:

- **Staff menu entry:** an `adminItem('staff-statistics', 'staff/statistics',
  'header.nav_staff_statistics')` next to the existing staff items in `HeaderNavHelper.jsx`,
  plus whether a card is added to the staff dashboard (`dashboardCardConfig.js`).
- **Tab shell:** one shell component rendering the filter bar and the tab nav, modelled on
  `StaffPhotoTabs.jsx`; each tab is its own route, so tab links must carry the current query.
- **Routes:** the eight hash routes (`staff/statistics` → Overview, `staff/statistics/visits`,
  `…/visitors`, `…/duration`, `…/domains`, `…/users`, `…/visit-list`) and their route keys in
  `HashRouteResolver.js`.
- **Gates:** one `staffOrSuperuser` entry per route key in `accessRouteConfig.js`
  (as `staffDashboard`, `staffUsers`).
- **URL params:** final names for `from`, `to`, `granularity`, `user`, `domain`, `audience`
  (values, defaults, how "unknown" domain and "any" are encoded, omitted-when-default rule),
  and the addition of these keys to the `HashRouteResolver` filter-key allowlist. `tz` is not
  in the URL: the client adds it from `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- **User filter:** reuse `staff/users.json?search=` as-is; note the label shown for a
  `user` id loaded from the URL.

## Files to Change
- `docs/agents/specs/access-statistics/shared-infrastructure.md` — Navigation and URL query state sections.

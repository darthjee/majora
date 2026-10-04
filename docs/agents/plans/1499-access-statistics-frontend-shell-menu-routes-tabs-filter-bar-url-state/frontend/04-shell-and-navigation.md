# Tab shell, tab pages and navigation

Implement the **Navigation and routes** section of `docs/agents/specs/access-statistics/shared-infrastructure.md`.

- `pages/helpers/StatisticsTabs.js`: the ordered tab list
  `[{ key, path, labelKey }]` — `overview` → `/staff/statistics`, `visits`, `visitors`,
  `duration`, `domains`, `users`, `visit_list` → `/staff/statistics/visit-list` — shared by
  the tab nav and the pages.
- `pages/elements/StaffStatisticsTabs.jsx` (prop `activeTab`): same markup as
  `StaffPhotoTabs.jsx` (`<ul className="nav nav-tabs flex-wrap mb-3">`, `nav-link` /
  `active`, `aria-current="page"`), each `href` = `'#' + statisticsHref(tab.path,
  currentFilters)`, so filters carry and `page` / `per_page` / `sort` do not.
- `pages/elements/StaffStatisticsShell.jsx` (props `tab`, `resolvedGranularity`, `children`):
  renders the `staff_statistics_page.title` heading, `StaffStatisticsFilterBar`,
  `StaffStatisticsTabs`, then `children`.
- Seven route pages in `pages/`: `StaffStatistics.jsx` (Overview), `StaffStatisticsVisits.jsx`,
  `StaffStatisticsVisitors.jsx`, `StaffStatisticsDuration.jsx`, `StaffStatisticsDomains.jsx`,
  `StaffStatisticsUsers.jsx`, `StaffStatisticsVisitList.jsx`. Each runs the
  `AccessStore.ensureStaffOrSuperUser()` redirect (shared small page controller) and renders the
  shell with a placeholder body (`staff_statistics_page.placeholder`).
- Wiring:
  - `HashRouteResolver.js` `ROUTES`: after `['/staff/photos', 'staffPhotos']`, the six tab
    routes (`/staff/statistics/visits` → `staffStatisticsVisits`, … `/staff/statistics/visit-list`
    → `staffStatisticsVisitList`), then `['/staff/statistics', 'staffStatistics']`.
  - `AppHelper.jsx` `PAGES`: one entry per route key.
  - `accessRouteConfig.js`: `[{ kind: 'staffOrSuperuser' }]` per route key, after `staffPhotos`.
  - `HeaderNavHelper.jsx` `NAV_LINK_REGISTRY`: `adminItem('staff-statistics', 'staff/statistics',
    'header.nav_staff_statistics')` after `staff-photos`. No staff-dashboard card.

## Files to Change

- `frontend/assets/js/components/resources/staff_statistics/pages/helpers/StatisticsTabs.js` — new.
- `frontend/assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsTabs.jsx` — new.
- `frontend/assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsShell.jsx` — new.
- `frontend/assets/js/components/resources/staff_statistics/pages/StaffStatistics*.jsx` — seven new pages.
- `frontend/assets/js/components/resources/staff_statistics/pages/controllers/StaffStatisticsPageController.js` — new (access redirect).
- `frontend/assets/js/utils/routing/HashRouteResolver.js` — routes.
- `frontend/assets/js/components/helpers/AppHelper.jsx` — `PAGES`.
- `frontend/assets/js/utils/access/accessRouteConfig.js` — gates.
- `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx` — menu entry.

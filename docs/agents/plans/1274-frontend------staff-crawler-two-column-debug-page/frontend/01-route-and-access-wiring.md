# Route and access wiring

Register the new `/#/staff/crawler` route end-to-end (resolver, page-key
wiring, access gating) and scaffold the new `crawler` resource folder, exactly
mirroring how `staffDashboard`/`staff_dashboard` are wired today.

## Files to Change

- `frontend/assets/js/utils/routing/HashRouteResolver.js` — add
  `['/staff/crawler', 'staffCrawler']` to `ROUTES`, next to the existing
  `['/staff/dashboard', 'staffDashboard']` entry.
- `frontend/assets/js/utils/access/accessRouteConfig.js` — add
  `staffCrawler: [{ kind: 'staffOrSuperuser' }]`, next to the existing
  `staffDashboard` entry.
- `frontend/assets/js/components/helpers/AppHelper.jsx` — import the new
  `StaffCrawler` page component (written in step 04) and add
  `staffCrawler: <StaffCrawler />` to the `PAGES` map, next to
  `staffDashboard: <StaffDashboard />`.
- `frontend/assets/js/components/resources/crawler/pages/` — new resource
  folder (create `controllers/` and `helpers/` subfolders), per
  `docs/agents/frontend/directory-structure.md`'s per-resource convention.
  Populated by steps 02–04.

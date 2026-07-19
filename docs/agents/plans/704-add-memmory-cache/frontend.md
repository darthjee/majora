# Frontend Plan: Add memory cache

Main plan: [plan.md](plan.md)

## Shared contracts

- Calls `DELETE /staff/cache.json` (staff-or-superuser only, `X-Skip-Cache: true` on the
  response, `200`/`204` on success) — provided by the backend agent.
- Registers route `#/staff/dashboard` → page key `staffDashboard`, gated with
  `{ kind: 'staffOrSuperuser' }` (same as `staffUsers`).

## Implementation Steps

### Step 1 — Icon

Add `databaseFillDash: 'bi-database-fill-dash'` to
`frontend/assets/js/utils/ui/Icons.js`, following the existing alphabetized-by-concept style.

### Step 2 — Translations

Add a new `staff_dashboard:` namespace to `frontend/assets/i18n/en.yaml` (and `pt.yaml`, since
both files exist) with the button's tooltip text, e.g.:

```yaml
staff_dashboard:
  clear_cache_tooltip: Clear Cache
```

Run `npm run check_i18n` (CI job `frontend-checks`) to confirm both language files stay in sync.

### Step 3 — Client

Add a `clearCache(token)` method — either as a new `StaffCacheClient.js` (mirroring
`StaffUserClient.js`) or a method added to `StaffUserClient.js` if the two are judged closely
related enough to share a client. It issues
`this.request('/staff/cache.json', { method: 'DELETE', headers: this.buildHeaders(token) })`.
No `skipCacheEndpoints`/`skipCacheSuffixes` entry is needed — every non-GET request already
bypasses the frontend cache (issue #226).

### Step 4 — Page

New page under `frontend/assets/js/components/resources/staff_dashboard/pages/`, mirroring the
`staff_user` pages' page/controller/helper split (see `StaffUsers.jsx` +
`controllers/StaffUsersController.js` for the template):

- `StaffDashboard.jsx` — on mount, `AccessStore.ensureStaffOrSuperUser()` (redirect otherwise,
  same as `StaffUsersController.buildEffect()`); renders a single `Card` containing one
  `Button`, wrapped in `CardHoverTooltip` (tooltip text from the new i18n key) with the
  `bi-database-fill-dash` icon; clicking it calls the controller's clear-cache handler.
- `controllers/StaffDashboardController.js` (extends `BasePageController`) — owns the
  clear-cache call (via the new client) and any loading/success/error state the button needs
  (e.g. a brief disabled/spinner state while the request is in flight, and a success/error
  message — follow whatever lightweight feedback pattern `StaffUsersController`'s
  recovery-link handlers already use).
- `helpers/StaffDashboardHelper.jsx` — pure render functions (loading/error/main), same split
  as `StaffUsersHelper.jsx`.

### Step 5 — Routing

- Register `['/staff/dashboard', 'staffDashboard']` in
  `frontend/assets/js/utils/routing/HashRouteResolver.js` (alongside the other `/staff/...`
  entries).
- Import `StaffDashboard` and add `staffDashboard: <StaffDashboard />` to the page map in
  `frontend/assets/js/components/helpers/AppHelper.jsx`.
- Add `staffDashboard: [{ kind: 'staffOrSuperuser' }]` to
  `frontend/assets/js/utils/access/accessRouteConfig.js`.

### Step 6 — Tests

New Jasmine specs mirroring `frontend/specs/.../staff_user/...` for the page, controller, and
helper, plus a spec for the new client method.

## Files to Change

- `frontend/assets/js/utils/ui/Icons.js` — add `databaseFillDash`.
- `frontend/assets/i18n/en.yaml`, `frontend/assets/i18n/pt.yaml` — add `staff_dashboard` keys.
- `frontend/assets/js/client/StaffCacheClient.js` (new, or a method on `StaffUserClient.js`).
- `frontend/assets/js/components/resources/staff_dashboard/pages/StaffDashboard.jsx` (new)
- `frontend/assets/js/components/resources/staff_dashboard/pages/controllers/StaffDashboardController.js` (new)
- `frontend/assets/js/components/resources/staff_dashboard/pages/helpers/StaffDashboardHelper.jsx` (new)
- `frontend/assets/js/utils/routing/HashRouteResolver.js` — new route entry.
- `frontend/assets/js/components/helpers/AppHelper.jsx` — new page import + map entry.
- `frontend/assets/js/utils/access/accessRouteConfig.js` — new `staffDashboard` access entry.
- `frontend/specs/...` — new specs mirroring the files above.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- No header/nav link to the new page is requested by the issue — only the route, the page
  itself, and the "Clear Cache" button. Skip adding a nav entry unless asked.
- The endpoint response body shape wasn't specified by the issue; treat it as irrelevant to the
  frontend (status code only) unless the backend agent documents something to display.

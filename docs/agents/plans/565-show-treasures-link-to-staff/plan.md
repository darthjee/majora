# Plan: Show treasures link to staff

Issue: [565-show-treasures-link-to-staff.md](../../issues/565-show-treasures-link-to-staff.md)

## Overview
The header's "Treasures" nav link is currently only shown to superusers, even though the `/treasures` route itself already grants access to both staff and superusers. This plan widens the link's visibility check to match the route's actual access rule, reusing the exact pattern already used by the neighboring "Staff Users" nav link.

## Context
`HeaderHelper.#renderTreasuresNavLink` (`frontend/assets/js/components/common/helpers/HeaderHelper.jsx`) gates the link on `state.isSuperUser` alone:

```js
static #renderTreasuresNavLink(state) {
  if (!state.isSuperUser) {
    return null;
  }
  return <Nav.Link href="#/treasures">{Translator.t('header.nav_treasures')}</Nav.Link>;
}
```

Meanwhile:
- The route's access config already declares `treasures: [{ kind: 'staffOrSuperuser' }]` in `frontend/assets/js/utils/access/accessRouteConfig.js`.
- The page's own runtime guard (`TreasuresController.buildEffect()`) calls `AccessStore.ensureStaffOrSuperUser()` and redirects to `/` only if the user is neither staff nor superuser — so staff can already reach and use the page today, just not discover it via the header.
- The immediately adjacent `#renderStaffUsersNavLink` (`HeaderHelper.jsx:78-84`) already implements the correct staff-or-superuser check:

```js
static #renderStaffUsersNavLink(state) {
  if (!state.isSuperUser && !state.isStaff) {
    return null;
  }
  return <Nav.Link href="#/staff/users">{Translator.t('header.nav_staff_users')}</Nav.Link>;
}
```

`state.isStaff` is already populated in `Header.jsx` (from `HeaderController.checkStatus()` reading `data.is_staff`) and passed into `HeaderHelper.render()`, so no new state plumbing is needed — this is a pure visibility-condition fix.

## Implementation Steps

### Step 1 — Widen the Treasures nav link visibility check
In `frontend/assets/js/components/common/helpers/HeaderHelper.jsx`, change `#renderTreasuresNavLink`'s guard from `if (!state.isSuperUser)` to `if (!state.isSuperUser && !state.isStaff)`, mirroring `#renderStaffUsersNavLink`. Update the method's JSDoc `@param` type from `{{isSuperUser: boolean}}` to `{{isSuperUser: boolean, isStaff: boolean}}` and its description from "admin-only" to "admin-or-staff-only", matching the style already used on `#renderStaffUsersNavLink`.

### Step 2 — Update the existing spec
In `frontend/specs/assets/js/components/common/helpers/HeaderHelper/navLinksSpec.js`:
- The existing test `'does not render the Treasures nav link when the user is not a superuser'` (rendering with `{ isSuperUser: false }`) currently omits `isStaff`, which defaults to falsy in the spec's `render` helper — confirm this still passes as "hidden when neither role is present" (rename the test to reflect "neither staff nor superuser" if the helper's default makes that the accurate description).
- Add a new test asserting the link **is** rendered when `{ isStaff: true }` (and `isSuperUser` falsy), matching the existing pattern used for the Staff Users link tests in the same file (see the `isStaff: true` case referenced around line 40 for that link).

## Files to Change
- `frontend/assets/js/components/common/helpers/HeaderHelper.jsx` — widen `#renderTreasuresNavLink`'s condition to include `isStaff`, update its JSDoc.
- `frontend/specs/assets/js/components/common/helpers/HeaderHelper/navLinksSpec.js` — add/adjust specs covering the Treasures link for staff users.

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes
- No backend, translation, or route/access-config changes are needed — `is_staff` is already exposed by the `/status` endpoint and already wired through `HeaderController` → `Header.jsx` → `HeaderHelper`.
- No new translation keys are needed; `header.nav_treasures` already exists and is reused as-is.

# Issue: Show treasures link to staff

## Description
The "Treasures" link in the header navigation (`#/treasures`) should be visible to both staff and admin (superuser) users, not only admins.

## Problem
`HeaderHelper.#renderTreasuresNavLink` (`frontend/assets/js/components/common/helpers/HeaderHelper.jsx`) only renders the "Treasures" nav link when `state.isSuperUser` is true. Staff users cannot see the link in the header, even though the `/treasures` route itself already grants access to both staff and superusers (`frontend/assets/js/utils/access/accessRouteConfig.js`, `treasures: [{ kind: 'staffOrSuperuser' }]`). Staff must currently know the direct URL to reach the page.

## Expected Behavior
The "Treasures" header nav link is visible to both staff and superuser (admin) users, consistent with the access already granted to the `/treasures` route, and consistent with the existing "Staff Users" nav link, which is shown via `#renderStaffUsersNavLink` for `isSuperUser || isStaff`.

## Solution
Update `#renderTreasuresNavLink` in `HeaderHelper.jsx` to check `state.isSuperUser || state.isStaff`, mirroring `#renderStaffUsersNavLink`. Update the existing spec in `frontend/specs/assets/js/components/common/helpers/HeaderHelper/navLinksSpec.js` (which currently asserts the link is hidden for non-superusers) to reflect that staff also see the link.

## Benefits
Staff can discover and navigate to the Treasures page through the header without needing to already know its URL, matching the access they already have to the underlying route.

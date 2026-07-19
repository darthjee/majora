# Issue: Fix players link

## Description
On a game page or any page under it (`/#/games/:game_slug/...`), the game dropdown menu should show a "Players" link (to `/#/games/:game_slug/players`, alongside the existing "Polls" and "Sessions" links) for any user who is admin, staff, DM, or player of that game. Currently the link never appears, for any of those roles.

## Problem
Investigation of `frontend/assets/js/components/common/header/` traced this to a race condition on initial mount of a game-scoped route, not to the role-check logic itself (which is already correct):

- `HeaderNavHelper#renderGameAccessNavItems` (`HeaderNavHelper.jsx`) only renders the Players/Polls/Sessions items when `state.gameAccess` has `is_dm`, `is_player`, `is_superuser`, or `is_staff` truthy — correct roles, correct condition.
- `Header.jsx` fetches the real access via `HeaderGameAccessController`, in a `useEffect` keyed on `route.gameSlug`.
- Separately, `App.jsx`'s own `useEffect` calls `AppController.buildEffect()`, which invokes `AccessStore.syncForRoute(...)` and, as part of it, `AccessStore.reset()` — this aborts every in-flight access request and clears `AccessCache`.
- Because React fires child effects (`Header`'s) before parent effects (`App`'s), on first mount of a game-scoped route `Header`'s game-access fetch starts, then `App`'s effect runs `AccessStore.reset()` and aborts it before the response arrives.
- The aborted fetch resolves to `AccessCache`'s fail-closed default (`is_superuser: null, is_staff: null, is_dm: null, is_player: false`), so `gameAccess` ends up all-falsy and the Players/Polls/Sessions items never render for anyone.
- The effect never re-runs afterward (its dependency, `route.gameSlug`, doesn't change), so the dropdown stays broken for the rest of that page view once this happens on first mount.

## Expected Behavior
Any admin, staff, DM, or player viewing a game page (or any page under `/#/games/:game_slug/...`) sees the "Players" link in the game dropdown menu, reflecting their actual access — regardless of whether the page was reached via a fresh load/hash navigation or client-side route change.

## Solution
Make the header's game-access fetch resilient to `AccessStore.reset()` firing after it starts, e.g. by having `HeaderGameAccessController` re-fetch once the reset/sync completes (subscribing to `AccessEvents` for the game key rather than relying solely on mount/`gameSlug`-change), or by ensuring `AccessStore.reset()` doesn't discard a request that was only just issued in the same tick. Exact approach to be finalized during planning.

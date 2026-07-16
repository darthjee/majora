# Issue: DM should have access to view as feature in the frontend

## Description
Currently the "View As" facade feature (icon in the header, opening a modal to pick roles to view the app as) is only available to admin/staff users, gated by `HeaderViewAsController.checkAvailability()` calling `AccessStore.isReallyAdminOrStaff()`. DMs, even though they have elevated access within their own games, cannot use this feature at all.

Since being a DM is a per-game role (a user can be DM for some games and not others, via the `GameMaster` relation), a DM's use of the facade must be scoped to the specific game they are DMing, unlike an admin's facade which is not tied to any single game.

## Problem
- The "view as" icon/button is hidden for any user who is not staff/superuser, so DMs have no way to preview the game as a player or owner.
- The facade state (`AccessStoreFacade`) currently only tracks `{enabled, roles}` — it has no concept of which game the facade applies to, so there is nothing today that would stop a facade from silently carrying over between games.

## Expected Behavior
- A DM sees the "view as" icon only while on a game page (`/#/games/:game_slug`) for a game they are DM of; admin/staff keep seeing it everywhere as today. The icon's visibility check for DMs is re-evaluated whenever `route.gameSlug` changes.
- Clicking the icon opens the existing facade modal, offering the same three roles (dm, player, owner) regardless of whether the user activating it is a DM or an admin/staff.
- When a non-admin DM activates the facade, the current `game_slug` is stored alongside `{enabled, roles}` in the facade state.
- Navigating away from that `game_slug` — to a different game's page, or away from game pages entirely (e.g. dashboard, game list) — automatically disengages the facade. This disengage check lives in the facade object itself, so any consumer of the facade state benefits from it without extra wiring.
- Admin/staff-activated facades keep their current behavior (not scoped to a single game_slug, no auto-disengage on navigation).
- While a facade is engaged (for both DM and admin/staff activations), the "view as" icon gets a green background; disengaging (manually or via auto-disengage) removes it.

## Solution
- Extend `AccessStoreFacade` to optionally store the `game_slug` the facade was activated for (only set when the activating user is a DM rather than an admin/staff).
- Add a per-game-slug mismatch check inside `AccessStoreFacade` (or the code path that reads it) so that reading/refreshing the facade while on a different (or no) matching `game_slug` clears it.
- Extend `HeaderViewAsController.checkAvailability()` (or add a parallel check) so the "view as" icon also shows for DMs, using the per-game `is_dm` flag already available via `AccessStore.getGameAccess(gameSlug)`, re-evaluated when `route.gameSlug` changes.
- Style the "view as" icon with a green background while `AccessStore.getFacade().enabled` is true, for both DM- and admin-activated facades.

## Benefits
DMs can preview their game as a player or the game owner without needing admin/staff access, while keeping the facade correctly scoped so it can't leak into a different game's context. The green-background indicator also makes it clearer to admins/staff when a facade is active.

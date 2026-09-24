# Issue: Common Items: "Create" link hidden and /common_items/new redirects for staff/DM

## Description

A user who is **staff and DM** of a game cannot create Common Items:

- On `/#/games/:game_slug/common_items`, the "Create Common Item" link does not show.
- Opening `/#/games/:game_slug/common_items/new` directly redirects to `/#/games/:game_slug/common_items` almost at once.

The same user on the equivalent Items pages (`/#/games/:game_slug/items` and `/#/games/:game_slug/items/new`) sees what they should.

Steps to reproduce:

1. Log in as a user who is staff and DM of a game.
2. Open `/#/games/:game_slug/common_items`: the create link is missing.
3. Open `/#/games/:game_slug/common_items/new`: you are redirected back to `/#/games/:game_slug/common_items`.

## Problem

- Both common-item pages decide access from `can_create_common_item` in the game permissions response (`AccessStore.ensureGamePermissions`):
  - `frontend/assets/js/components/resources/common_item/pages/controllers/GameCommonItemsController.js` hides the create link when the flag is falsy.
  - `frontend/assets/js/components/resources/common_item/pages/controllers/GameCommonItemNewController.js` (`#redirectIfNotAllowed`) redirects to `/games/:game_slug/common_items` when the flag is falsy.
- **The backend never sends that flag.** `GamePermissionsSerializer` builds its response from `backend/permissions/config/pages/game.yml` (response keys) and `backend/permissions/config/game/ui.yml` (roles allowed per action). Both list `create_item`, `create_possession`, `create_document`, `create_npc` and `create_faction`, but neither has `create_common_item`. The frontend always reads `undefined` and treats every user as not allowed.
- The create endpoint itself is fine: `backend/permissions/config/game_common_item/endpoints.yml` already allows `regular.create: [staff, player]` (plus the dm/admin shortcut).
- The frontend check came from #826 (PR #1147), which added the `game_common_item` configs but never added the flag to the game permissions response.

## Expected Behavior

The "Create Common Item" link shows and `/common_items/new` stays open for dm/admin, staff and players of the game, the same as for Items. Users who are not allowed are still redirected.

## Solution

- Add `create_common_item: can_create_common_item` under `game:` in `backend/permissions/config/pages/game.yml`.
- Add `create_common_item: [staff, player]` to `backend/permissions/config/game/ui.yml`, matching `create_item` and the `game_common_item` create endpoint rule.
- Add or extend backend tests for the game permissions response (`/permissions/game.json` and the per-game endpoint) so they cover `can_create_common_item` for each role.
- Check whether any frontend permission fixtures or specs, or the Navi cache config, need updating (no frontend logic change is expected).

Acceptance criteria:

- [ ] The game permissions response includes `can_create_common_item`: true for dm/admin/staff/player of the game, false otherwise.
- [ ] Allowed users see the create link on `/#/games/:game_slug/common_items`.
- [ ] `/#/games/:game_slug/common_items/new` no longer redirects allowed users.
- [ ] Backend tests cover the new flag; frontend specs still pass.

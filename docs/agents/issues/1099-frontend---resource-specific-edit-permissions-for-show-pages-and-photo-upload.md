# Issue: Frontend — Resource-specific edit permissions for show pages and photo upload

## Problem
`GamePossessionController.js`, `GameItemController.js`, `GameFactionController.js`, and `GameDocumentController.js` all derive their Edit-button visibility on the game-level possession/item/faction/document show pages from `AccessStore.ensureGamePermissions(gameSlug).can_edit` — the game-level admin/dm-only permission — rather than a resource-specific check. `AccessStorePermissions` (`frontend/assets/js/utils/access/store/`) currently only implements `ensureGame`/`ensureCharacter`/`ensureTreasure`; there is no `ensurePossessionPermissions`/`ensureItemPermissions`/`ensureFactionPermissions`/`ensureDocumentPermissions`.

Separately, `GamePhotosController.js`'s upload button on the `GamePhotos` index page has the same wrong-check symptom (also reading off `ensureGamePermissions().can_edit`), even though the backend photo-upload endpoints are already correctly configured for staff/player access.

There is also no backend endpoint yet for the new `AccessStore.ensure*Permissions` methods to call: every existing `ensure*Permissions` method (`ensureGame`, `ensureCharacter`, `ensureTreasure`) is backed by an entity-agnostic `/permissions/<entity>.json` route (e.g. `/permissions/game_pc.json`), each a small DRF serializer + view + route mirroring `game_pc_permissions` (`backend/games/views/permissions/`). No such endpoint exists for `game_possession`/`game_item`/`game_faction`/`game_document`. Per #1097's own Solution, that sibling backend issue deliberately only adds `ui.yml` config for these resources and leaves "nothing currently calls `UIPermission` for these three resources" as forward-looking work for this issue.

Part of #944 (sub-issue 3 of 3 — see #944 for the layer-split rationale; sibling sub-issue #1097 covers the corresponding backend PATCH permission work for possessions/items/factions, and another sibling covers the documents PATCH endpoint).

## Expected Behavior
Edit buttons on the possession/item/faction/document show pages, and the upload button on the `GamePhotos` index page, should show for:
- admin and dm, as always/default
- staff and player, in addition

## Solution
- Backend: add four small entity-agnostic `/permissions/<entity>.json` endpoints (`game_possession`, `game_item`, `game_faction`, `game_document`), each a `<Resource>PermissionsSerializer` + view function + route, mirroring `game_pc_permissions`/`CharacterPermissionsSerializer` (`backend/games/views/permissions/game_pc_permissions.py`, `backend/games/serializers/characters/character_permissions.py`). Each serializer resolves the `edit` action of its resource's `ui.yml` via `UIPermission`/`PermissionsBuilder`, unconditionally (no scoped/owner variant, unlike treasure) — no game/character instance needed, matching the `game_pc`/`game_npc`/`game` precedent exactly. Depends on `ui.yml` existing for each resource: `game_possession`/`game_item`/`game_faction` from sibling #1097, `game_document` from the documents-PATCH sibling.
- Add resource-specific permission methods (`ensurePossessionPermissions`, `ensureItemPermissions`, `ensureFactionPermissions`, `ensureDocumentPermissions`) to `AccessStore`/`AccessStorePermissions`, mirroring the existing `ensureTreasure`/`ensureGame` pattern, calling the four new endpoints above.
- Repoint `GamePossessionController.js`, `GameItemController.js`, `GameFactionController.js`, and `GameDocumentController.js`'s `#loadCanEdit` to the new resource-specific checks instead of `ensureGamePermissions(gameSlug)`.
- Fix `GamePhotosController.js`'s upload button visibility by reusing the existing correct pattern already used elsewhere for photo-upload gating (`#loadCanUploadPhoto` in the possession/item/faction/document controllers computes `AccessStore.ensureGameAccess(gameSlug)` into `is_superuser || is_staff || is_dm || is_player`) instead of `ensureGamePermissions().can_edit` — no backend dependency, can proceed independently.

## Benefits
- Staff and players can see (and use) the Edit button on possession/item/faction/document show pages and the photo-upload button, matching the backend permissions already granted or being granted by the sibling sub-issues.
- Removes the last game-level-only permission check standing in for a resource-specific one on these pages.
- Closes the plumbing gap #1097 deliberately left open, so its `ui.yml` config actually gets consumed somewhere.

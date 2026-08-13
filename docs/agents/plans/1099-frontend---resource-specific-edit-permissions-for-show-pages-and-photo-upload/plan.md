# Plan: Frontend — Resource-specific edit permissions for show pages and photo upload

Issue: [1099-frontend---resource-specific-edit-permissions-for-show-pages-and-photo-upload.md](../../issues/1099-frontend---resource-specific-edit-permissions-for-show-pages-and-photo-upload.md)

## Overview

`GamePossessionController.js`, `GameItemController.js`, `GameFactionController.js`, and `GameDocumentController.js` gate their Edit buttons on the wrong, game-level `AccessStore.ensureGamePermissions().can_edit` check. Fixing that on the frontend requires a resource-specific permission source that doesn't exist yet on the backend, so this plan adds four small entity-agnostic `/permissions/game_<resource>.json` endpoints (mirroring the existing `/permissions/game_pc.json` pattern) before wiring the frontend's new `AccessStore.ensure<Resource>Permissions` methods to them. `GamePhotosController.js`'s upload button is fixed independently, reusing an existing in-repo pattern with no backend dependency.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [cache](cache.md)

## Shared contracts

**New backend endpoints** (entity-agnostic, no path params, same shape as `/permissions/game.json`/`/permissions/game_pc.json`):

- `GET /permissions/game_possession.json`
- `GET /permissions/game_item.json`
- `GET /permissions/game_faction.json`
- `GET /permissions/game_document.json`

Each:
- Auth: `CookieTokenAuthentication`, `permission_classes([AllowAny])` (the `UIPermission` check inside the serializer is what actually gates the boolean, not DRF-level auth — same as every other `/permissions/*.json` route).
- Accepts repeated `?role=` query params for the simulated-preview path (`parse_role_booleans`), identical to every existing `/permissions/*.json` route.
- Response body: `{"can_edit": boolean}` — exactly one key, no other permission flags.
- Backed by a new `regular.edit`/`edit` tier read from each resource's `ui.yml` (`backend/permissions/config/game_possession/ui.yml`, `game_item/ui.yml`, `game_faction/ui.yml`, `game_document/ui.yml`) via `UIPermission`/`PermissionsBuilder`. `game_possession`/`game_item`/`game_faction`'s `ui.yml` files are created by sibling issue #1097; `game_document`'s `ui.yml` is created by the documents-PATCH sibling issue. **The backend step below must not proceed until those `ui.yml` files exist on this branch** (merge/rebase #1097 and the documents sibling first, or coordinate landing order) — the config lookup will raise if the file is missing.

**Frontend consumption**: `AccessStore.ensurePossessionPermissions(gameSlug)`, `ensureItemPermissions(gameSlug)`, `ensureFactionPermissions(gameSlug)`, `ensureDocumentPermissions(gameSlug)` each resolve to `{can_edit: boolean}` by calling the matching endpoint above, role-scoped by the same game-level role derivation `ensureGamePermissions` already uses (`AccessStoreAccess.ensureGame`/`getGame`) — these resources have no owner/scoped concept of their own, so they always resolve at the game level, same as `game_pc`/`game_npc`.

**Cache warming**: the navi config must warm all four new routes with the same five `?role=` permutations already used for `permissions_game`/`permissions_game_pc`/`permissions_game_npc` in `navi/resources/permissions.yml`.

## Notes

- Order matters: land backend first (or at least have `ui.yml` for all four resources present locally), then frontend, then cache — cache warming a 404/500 endpoint would just fail loudly, and frontend calling a nonexistent endpoint fails closed (`can_edit: false`) rather than erroring, so a frontend-before-backend landing order degrades silently instead of breaking tests, which is worse for catching mistakes.

# Plan: Add Character Possession

Issue: [1076-add-character-possession.md](../issues/1076-add-character-possession.md)

## Overview

Add `CharacterPossession`, the character-side join to the already-existing `GamePossession` (#1074). Attribute-wise it's a thin join like `CharacterDocument` (no per-character overrides). Action-wise it supports both flows `CharacterItem` supports — acquiring an existing `GamePossession` via a modal, and creating a brand-new one from a character page — so its permission/endpoint wiring mirrors `CharacterItem`'s, minus anything tied to override fields (no character-level `update`/`photo_upload`). Editing name/description and replacing the photo happen directly against `GamePossession`'s existing endpoints (already built in #1074), not a new character-side action.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [cache](cache.md)
- [translator](translator.md)

## Shared contracts

**New model** — `CharacterPossession` (`backend/games/models/character/character_possession.py`): `character` (FK, `CASCADE`), `game_possession` (FK, `CASCADE`), `hidden` (plain `BooleanField`, default `False`, never inherited from `GamePossession`), `unique_together = [('character', 'game_possession')]`.

**New permission resources** — `game_pc_possession` / `game_npc_possession` (`backend/permissions/config/game_pc_possession/endpoints.yml`, `.../game_npc_possession/endpoints.yml`):

| Scope | Action | Used by | PC | NPC |
|---|---|---|---|---|
| restricted | `create` | acquire/remove (unconditional) | `staff`, `owner` | `staff` |
| regular | `create_update` | create-from-scratch (`possessions.json` POST) | `staff`, `player`, `owner` | `staff`, `player` |

No `photo_upload` action — the photo lives only on `GamePossession`.

**New JSON endpoints** (character-scoped, `<slug:game_slug>/(pc|npc)s/<int:character_id>/...`, added to `backend/games/urls/_character_routes.py`'s `_CHARACTER_ROUTES`):

- `GET`/`POST /possessions.json` — list (regular) / create-from-scratch (creates `GamePossession` + `CharacterPossession` together, `regular.create_update`)
- `GET /possessions/all.json` — DM/owner full list incl. hidden
- `GET /possessions/<int:possession_id>.json` — detail (thin, GET-only — nothing to `PATCH`)
- `GET /possessions/<int:possession_id>/full.json` — DM/owner detail incl. hidden
- `GET /possessions/available.json` / `/possessions/available/all.json` — catalog minus already-owned, feeds the acquire modal
- `POST /possessions/acquire.json` / `/possessions/acquire/all.json` — `restricted.create`
- `POST /possessions/remove.json` / `/possessions/remove/all.json` — `restricted.create`

**No new endpoint for edit/photo** — the character-side new/edit/detail pages call the *existing* game-level endpoints directly against the `GamePossession` id: `PATCH /games/:slug/possessions/:id.json` and `POST /games/:slug/possessions/:id/photo_upload.json` (built in #1074, gated by `game_possession`'s own `regular` permissions: `staff`, `player`).

**Serializers** (`backend/games/serializers/characters/character_possession.py`) — `CharacterPossessionSerializer` (`id`, `game_possession_id`, `name`, `description`, `photo_path`, all sourced from `game_possession`, mirroring `CharacterDocumentSerializer`) and `CharacterPossessionAllSerializer` (`+ hidden`, via `HiddenFieldMixin`, mirroring `CharacterDocumentAllSerializer`).

**Frontend resource config** (`frontend/assets/js/utils/requests/config/possessionConfig.js`) — add `kind`-branching (`'game'` vs `'pcs'/'npcs'`) to `GET.collection`, `GET.single`, `POST.collection` only, mirroring `itemConfig.js`'s pattern. `PATCH.single` and the photo `POST.single` stay unconditionally game-level (unchanged) — the character-side pages call them with the `GamePossession` id directly. `RequestPermissionResolvers.js`'s `possession.collection`/`possession.single` need the same `kind === 'game' ? ensureGamePermissions : ensureCharacterPermissions(kind, ...)` branch `item`'s resolver already has.

**Frontend routes** (`HashRouteResolver.js` + `AppHelper.jsx`) — 4 new route keys per kind, matching Item's full shape (not Document's list-only shape): `(pc|npc)CharacterPossessions`, `(pc|npc)CharacterPossessionNew`, `(pc|npc)CharacterPossessionEdit`, `(pc|npc)CharacterPossession` (detail). `new`/`:id/edit` registered before the bare `:id` route.

**Cache** — new Navi resources `pc_possessions` / `paginated_pc_possessions` / `short_pc_possessions` (+ `npc_` equivalents) in `navi/resources/pcs.yml` / `npcs.yml`, chained from the `pc`/`npc` resource's `actions`, mirroring `pc_items`/`pc_documents`.

**i18n** — new `character_possessions_page.yaml` (en/pt), registered in `frontend/assets/i18n/{en,pt}/index.js`, following `character_items_page.yaml`'s shape (it has `new_item`/`exchange_items` keys, unlike `character_documents_page.yaml`, since Possession supports both create and acquire like Item does).

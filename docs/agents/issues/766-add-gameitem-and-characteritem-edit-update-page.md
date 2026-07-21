# Issue: Add GameItem and CharacterItem edit/update page

## Description
Add edit pages and PATCH endpoints for `GameItem` and `CharacterItem`, completing the create → view → edit lifecycle started by #765 (single-entity item detail lives at `.../items/:id/full.json`). Three new frontend routes are added, each backed by a scoped PATCH endpoint that updates only `name`/`description`/`hidden` — photo stays on its existing dedicated upload endpoint, unaffected by this issue.

> **Depends on #765**: this issue relies on the `.../items/:id/full.json` route (renamed from `all.json` by #765). #765 is not merged yet at the time of writing, but is expected to land before implementation of this issue begins.

## Problem
- No PATCH endpoint exists for `GameItem` or `CharacterItem` today — only creation, detail-GET, and photo upload.
- No frontend edit page exists for items; users cannot change `name`/`description`/`hidden` after creation.
- Items have no photo-dimming treatment when `hidden` is toggled, unlike Characters (PC/NPC), which already dim their photo via a shared `dimmed` mechanic.
- NPC items need an extra permission wrinkle: `staff` can edit NPC items in general, but must lose access when the underlying NPC is itself hidden and the requester lacks permission to view hidden NPCs — mirroring the visibility rule already enforced on `GET /games/:game_slug/npcs/:character_id`.

## Expected Behavior
### Frontend routes
- `/#/games/:game_slug/items/:id/edit` — edit `GameItem`. Permission: dm, admin only.
- `/#/games/:game_slug/pcs/:character_id/items/:id/edit` — edit `CharacterItem`. Permission: dm, admin, owner, staff.
- `/#/games/:game_slug/npcs/:character_id/items/:id/edit` — edit `CharacterItem`. Permission: dm, admin, staff — except staff loses access if the NPC is hidden and the requester cannot view hidden NPCs (dm/admin only can).

### Visual
Same left/right layout as the existing item show page:
- Left: photo with an upload action button on the action bar; a switch for `hidden` that dims the photo when on (reusing the existing `dimmed`/`ActionsOverlay` mechanic already used on Character edit pages).
- Right: `name` (text input), `description` (textarea).

### Blank-field semantics (CharacterItem only)
Clearing `name`/`description` to blank on a `CharacterItem` edit form persists `null`, not an empty string — this reverts to the linked `GameItem`'s value via the existing fallback (`resolve_character_item_field`), consistent with #765's fallback design. `GameItem`'s own `name`/`description` remain required/non-null, since it has no fallback target.

### Backend
- `PATCH /games/:game_slug/items/:id.json` — updates only `GameItem`. Permission: dm, admin.
- `PATCH /games/:game_slug/pcs/:character_id/items/:id.json` — updates only `CharacterItem`. Permission: dm, admin, owner, staff.
- `PATCH /games/:game_slug/npcs/:character_id/items/:id.json` — updates only `CharacterItem`. Permission: dm, admin, staff, gated by the same hidden-NPC-visibility rule enforced on `GET /games/:game_slug/npcs/:character_id` (`backend/games/views/game/_shared.py`'s `_hidden_gate_response`: 404 when `character.hidden and not character.can_be_edited_by(request.user)`).
- `GET /games/:game_slug/npcs/:character_id` already 404s for unauthorized viewers of a hidden NPC (`backend/games/views/game/_detail.py` + `_shared.py`'s `_hidden_gate_response`) — verify with test coverage, no production code change expected here.

## Solution
### Backend
- Add PATCH views for the three routes above, modeled on the existing creation pattern (`backend/games/views/game/_item_create.py`: plain `serializers.Serializer`, explicit permission-check function returning an error `Response` or `None`). Only `name`/`description`/`hidden` are accepted; `photo` stays on the existing `item_photo_upload.json` endpoints.
- `GameItem` PATCH needs a new permission check (dm/admin only) — narrower than any existing item permission class (`CharacterItemCreatePermission`/`CharacterItemPhotoUploadPermission` both also allow staff and owner).
- NPC `CharacterItem` PATCH reuses the existing `_hidden_gate_response` check (`backend/games/views/game/_shared.py:32-38`) internally — no actual HTTP call to the GET endpoint, just the same in-process permission logic.

### Frontend
- New edit controllers/helpers for the three routes, following the existing `BaseCharacterEditController`/`BaseCharacterEditHelper` pattern (`frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterEditController.js`, `.../helpers/BaseCharacterEditHelper.jsx`) for the two character-item routes, and an analogous new Game Item edit controller/helper for the game-scoped route.
- Wire the existing `dimmed` prop (`ActionsOverlay`/`CharacterAvatarField` mechanic, currently only used for Characters) into the new item edit pages' photo, driven by the `hidden` switch state.
- Update the single shared opacity rule (`frontend/assets/css/main.scss:117-119`) from `opacity: 0.8` to `opacity: 0.6` (40% transparent, up from 20%) — this affects all existing usages (NPC edit page, NPC creation page, NPC list-card action bar) plus the new item edit pages, since they all share the same CSS class.

## Benefits
Completes the item lifecycle (create → view → edit) started by #765, and keeps the hidden-NPC visibility rule consistently enforced across every endpoint that touches character/item detail for a given NPC.

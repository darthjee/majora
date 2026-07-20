# Issue: Add PC item creation

## Description
Players need a way to add items to the inventory of PCs they own, and DMs (plus admins/staff) need to be able to add items to NPCs. Today the PC and NPC items pages (`PcCharacterItems.jsx` / `NpcCharacterItems.jsx`) are read-only list views — there is no "Create Item" action in the UI, and no backend endpoint exists to create a `CharacterItem`.

The underlying data model already supports this: `CharacterItem` (character-scoped, with nullable `name`/`description` overrides and a `hidden` flag) belongs to a `GameItem` (the game-scoped item record holding the canonical `name`/`description`/`hidden`). The list/read endpoints (`.../items.json` and `.../items/all.json`, filtered/unfiltered by `hidden`) already exist for both PCs and NPCs. This issue is scoped to adding the missing **creation** path: a new "Create Item" UI flow plus the backend endpoint that creates a `GameItem` and its linked `CharacterItem` together.

The button is named "Create Item" (not "Add item") deliberately: a future issue will introduce a separate "Add item" flow that links a character to an already-existing `GameItem` from the game's catalog, rather than creating a brand-new one. This issue is only about creating brand-new `GameItem`s.

## Problem
- The PC and NPC items pages have no "Create Item" button or form — they are explicitly read-only today.
- There is no backend endpoint to create a `CharacterItem`/`GameItem` pair (unlike, e.g., treasures, which already has a creation endpoint).
- Without this, players can't record items their character owns, and DMs/staff can't add items to NPCs.

## Expected Behavior

### Affected pages
- PC items page — `/#/games/:game_slug/pcs/:id/items`
- NPC items page — `/#/games/:game_slug/npcs/:id/items`

### UI changes on the items pages
- Add a "Create Item" button.
  - Visible/enabled only for roles permitted to create items (see permissions below).
  - Navigates to the new item form:
    - `/#/games/:game_slug/pcs/:id/items/new` for PCs
    - `/#/games/:game_slug/npcs/:id/items/new` for NPCs

### New pages
New item creation forms, following the existing conventions used by `GameNpcNew.jsx`/`GameTreasureNew.jsx` (text field, textarea, and a `hidden` switch rendered as the existing Bootstrap `form-check form-switch` pattern):
- `/#/games/:game_slug/pcs/:id/items/new`
- `/#/games/:game_slug/npcs/:id/items/new`

### Fields
- `name`: string
- `description`: textbox
- `hidden`: switch

### New endpoint
- `POST /games/:game_slug/pcs/:id/items.json`
- `POST /games/:game_slug/npcs/:id/items.json`

Each creates a new `GameItem` (game-scoped) with the submitted `name`/`description`/`hidden`, and a `CharacterItem` linked to it via `game_item`, belonging to the PC/NPC. The `CharacterItem` is created with the same `name`/`description`/`hidden` values as the new `GameItem` (explicitly duplicated, not left null) — always a brand-new `GameItem` is created per submission; there is no picker to reuse an existing `GameItem` from the game's catalog. Photo upload is out of scope for this issue.

### Endpoint permissions
| Endpoint | Permitted roles |
|---|---|
| `POST /games/:game_slug/pcs/:id/items.json` | dm, admin, staff, owner |
| `POST /games/:game_slug/npcs/:id/items.json` | dm, admin, staff |

(Existing, already-implemented read endpoints for reference — no change needed: `GET .../items.json` is open to everyone and filters out hidden items; `GET .../items/all.json` includes hidden items and is restricted — dm/admin/owner for PCs, dm/admin for NPCs.)

### UI permissions
- Both items pages remain visible to everyone; data loading from `.../items.json` vs `.../items/all.json` is unchanged (existing behavior).
- "Create Item" button/page:
  - PCs: dm, admin, staff, owner
  - NPCs: dm, admin, staff

## Solution
- Backend: add a creation serializer/view for `CharacterItem`+`GameItem`, following the existing `build_items_view`/`build_items_all_view` factory pattern under `games/views/game/_items.py`, wired through the shared PC/NPC route builder (`games/urls/_character_routes.py`). Add a dedicated edit/create permission class following the existing `_EditPermission` subclass pattern (e.g. `TreasureEditPermission`, `CharacterEditPermission`) to encode the dm/admin/staff/owner rules above.
- Frontend: add `.../items/new` routes and pages for PCs and NPCs, reusing the existing form-field conventions from `GameNpcNew.jsx`/`GameTreasureNew.jsx` (plain text field for `name`, `CharacterDescriptionField`-style textarea for `description`, Bootstrap `form-check form-switch` checkbox for `hidden`). Add the "Create Item" button to `PcCharacterItems.jsx`/`NpcCharacterItems.jsx`, gated by the permissions above.
- No changes needed to the existing GET list/all endpoints or models — they already support this feature.

## Benefits
- Players can record and manage the items their PC owns.
- DMs, admins, and staff can add items to NPCs.
- Completes the items feature (previously read-only) with a creation flow consistent with existing patterns (e.g. treasures).

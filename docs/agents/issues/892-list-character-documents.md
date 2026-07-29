# Issue: List Character Documents

## Description
`CharacterDocument` (`backend/games/models/character/character_document.py`) currently mirrors `CharacterItem` (`backend/games/models/character/character_item.py`): both represent a character's instance of a game-level definition (`GameDocument`/`GameItem`), with nullable `name`/`description`/`photo` override fields that flavor the instance, falling back to the game-level version when unset.

Requests to these resources go through `RequestStore` (`frontend/assets/js/utils/requests/RequestStore.js`), configured per-resource. Documents are configured in `frontend/assets/js/utils/requests/config/documentConfig.js`; items in the equivalent `itemConfig.js`.

## Problem
### Not flavorable
A document is not something a character has their own instance of — it is a fixed piece of information shared by the DM. `CharacterDocument` should not carry `name`/`description`/`photo` overrides or its own photo table.

### There is no list or show page for `CharacterDocument`
Missing:
- `CharacterDocument` shortlist on `/#/games/:game_slug/(n)pcs/:character_id` (already wired to fetch via `RequestStore`, but click-through is disabled — there is no detail page to link to)
- `CharacterDocument` full paginated list at `/#/games/:game_slug/(n)pcs/:character_id/documents`
- `CharacterDocument` show page at `/#/games/:game_slug/(n)pcs/:character_id/documents/:id`

## Solution
### Remove flavors from `CharacterDocument`
- Remove from `CharacterDocument`:
  - `name`
  - `description`
  - `photo`
- Keep:
  - `id`
  - `character` (FK)
  - `game_document` (FK) — still the link to the `GameDocument` definition
  - `hidden`
- Remove table `games_characterdocumentphoto` and model `CharacterDocumentPhoto` (plus the paired `versioning` app historical-model migration for both)
- Remove the now-dead `resolve_character_document_field`/`resolve_character_document_photo_path` override-resolution helpers and related tests

### Rely on `GameDocument` data in the `CharacterDocument` serializer
#### Public serializer
- `id`: `CharacterDocument.id`
- `name`: `GameDocument.name`
- `photo_path`: `GameDocument.photo_path`
- `game_document_id`: `CharacterDocument.game_document_id`

#### Private serializer
- `id`: `CharacterDocument.id`
- `name`: `GameDocument.name`
- `photo_path`: `GameDocument.photo_path`
- `hidden`: `CharacterDocument.hidden`
- `game_document_id`: `CharacterDocument.game_document_id`

### Endpoints
List endpoints already exist (`backend/games/views/game/_documents.py`); only the detail/"show" endpoints are new, mirroring `CharacterItem`'s `character_item_detail` / `build_item_detail_view` / `build_item_detail_full_view` pattern.

#### Public PC document list `GET /games/:game_slug/pcs/:character_id/documents.json`
- exposes using public serializer, paginated
- lists documents belonging to PC
- does not list hidden `CharacterDocument`
- does not check `GameDocument` hidden status
- accessible by everyone

#### Public NPC document list `GET /games/:game_slug/npcs/:character_id/documents.json`
- exposes using public serializer, paginated
- lists documents belonging to NPC
- does not list hidden `CharacterDocument`
- returns 404 if NPC is hidden
- does not check `GameDocument` hidden status
- accessible by everyone

#### Public PC document show `GET /games/:game_slug/pcs/:character_id/documents/:id.json`
- exposes using public serializer
- does not show hidden `CharacterDocument` (404)
- does not check `GameDocument` hidden status
- accessible by everyone

#### Public NPC document show `GET /games/:game_slug/npcs/:character_id/documents/:id.json`
- exposes using public serializer
- does not show hidden `CharacterDocument` (404)
- returns 404 if NPC is hidden
- does not check `GameDocument` hidden status
- accessible by everyone

#### Private PC document list `GET /games/:game_slug/pcs/:character_id/documents/all.json`
- exposes using private serializer, paginated
- lists documents belonging to PC, including hidden ones
- does not check `GameDocument` hidden status
- accessible by dm, admin and owner

#### Private NPC document list `GET /games/:game_slug/npcs/:character_id/documents/all.json`
- exposes using private serializer, paginated
- lists documents belonging to NPC, including hidden ones
- returns 404 if NPC is hidden
- does not check `GameDocument` hidden status
- accessible by dm and admin

#### Private PC document show `GET /games/:game_slug/pcs/:character_id/documents/:id/full.json`
- exposes using private serializer, including hidden `CharacterDocument`
- accessible by dm, admin and owner

#### Private NPC document show `GET /games/:game_slug/npcs/:character_id/documents/:id/full.json`
- exposes using private serializer, including hidden `CharacterDocument`
- accessible by dm and admin

### Pages
All pages are accessible by everyone.

#### PC documents list page `/#/games/:game_slug/pcs/:character_id/documents`
- paginated list of PC documents

#### NPC documents list page `/#/games/:game_slug/npcs/:character_id/documents`
- paginated list of NPC documents

#### PC document show page `/#/games/:game_slug/pcs/:character_id/documents/:id`
Shows a single PC document

#### NPC document show page `/#/games/:game_slug/npcs/:character_id/documents/:id`
Shows a single NPC document

### Changes to existing pages
Wire up the click-through on the (N)PC show page's document shortlist (currently `action: 'none'` in `shortListResourceConfig.js`, and `buildCharacterDocumentHref()` in `documentListTypes.js` always returns `null`) so it navigates to the new show page, same as items already do.

Pages affected:
- PC show page `/#/games/:game_slug/pcs/:character_id`
- NPC show page `/#/games/:game_slug/npcs/:character_id`

### Documents shortlist
- tooltip: document `name`
- action: goes to `CharacterDocument` show page
  - `/#/games/:game_slug/pcs/:character_id/documents/:id` for PC
  - `/#/games/:game_slug/npcs/:character_id/documents/:id` for NPC
- per_page: default `5`
- "See More" icon: bootstrap `folder`

# Issue: Add Item and Character Item pages

## Description
Add detail pages for a single item: a game-level `GameItem` ('/#/games/:game_slug/items/:id') and a character-scoped `CharacterItem` on a PC or NPC ('/#/games/:game_slug/pcs/:character_id/items/:id' and '/#/games/:game_slug/npcs/:character_id/items/:id'), plus the backend endpoints they need.

## Problem
Items have no standalone detail page in scope (see `buildNullItemHref` in `listTypeConfig.js`, added for issue #658), so item cards elsewhere in the app (e.g. a character's inventory preview) are non-clickable. There is no way to view a single item's full details (photo, name, description, hidden status) in isolation, and no backend endpoint exists to fetch a single `GameItem` or `CharacterItem`.

## Expected Behavior
### Pages
- `/#/games/:game_slug/items/:id` — a single `GameItem`.
- `/#/games/:game_slug/pcs/:character_id/items/:id` — a single `CharacterItem` on a PC.
- `/#/games/:game_slug/npcs/:character_id/items/:id` — a single `CharacterItem` on an NPC.

### Layout
Simplified two-column layout (not the full `CharacterDetail.jsx` structure — no role/DM notes/money/treasures):
- Left column: photo and name.
- Right column: description.
- The photo shows the existing hidden badge when the item/character item is hidden.

### Data loading
For each page, the frontend requests the elevated (`all.json`) endpoint when the current user has access to it, falling back to the public endpoint otherwise.

### Endpoints
Naming follows the codebase's existing conventions (plural `games`/`pcs`/`npcs`, and the `/all.json` suffix already used by every other “DM/admin sees more” endpoint — not `/full.json`, which already means something else for characters).

#### Game items
- `GET /games/:game_slug/items/:id.json` — everyone. Excludes hidden items (404 if hidden) and omits the `hidden` attribute.
- `GET /games/:game_slug/items/:id/all.json` — admin, DM. Returns the item even if hidden, and includes the `hidden` attribute. Sets `X-Skip-Cache: true`, matching the existing `items/all.json` list endpoint.

#### PC items
- `GET /games/:game_slug/pcs/:character_id/items/:id.json` — everyone. Excludes hidden character items and omits the `hidden` attribute.
- `GET /games/:game_slug/pcs/:character_id/items/:id/all.json` — admin, DM, and the PC's owning player. Returns the item even if hidden and includes `hidden`. Since this endpoint returns `CharacterItem` (not `GameItem`), the owning player's access does not depend on the underlying `GameItem`'s hidden state. Sets `X-Skip-Cache: true`.

#### NPC items
- `GET /games/:game_slug/npcs/:character_id/items/:id.json` — everyone. Excludes hidden character items and omits the `hidden` attribute.
- `GET /games/:game_slug/npcs/:character_id/items/:id/all.json` — admin, DM only. Returns the item even if hidden and includes `hidden`. NPCs have no owner concept in this codebase (see `CharacterMoneyEditPermission`, `CharacterTreasureExchangePermission`, `CharacterItemCreatePermission`, and the existing `items/all.json` list endpoint's `_check_items_all_permission`), so this matches the existing NPC items-list `all.json` access exactly. Sets `X-Skip-Cache: true`.

### Link wiring
Existing non-clickable item cards (`buildNullItemHref` in `listTypeConfig.js` and any equivalent) are updated to link to the new detail pages, closing the gap left by issue #658.

## Solution
Backend: add single-item views next to the existing list views — `backend/games/views/games/` for `GameItem` (reusing `GameItemListSerializer`/`GameItemAllListSerializer` directly as the detail response shape), and under `backend/games/views/game/pcs/detail/items/` and `.../npcs/detail/items/` for `CharacterItem` (reusing `CharacterItemSerializer`/`CharacterItemAllSerializer`). Reuse `GameEditPermission` for the base-item and NPC-item `all.json` routes, and `CharacterEditPermission` for the PC-item `all.json` route — the same permission classes already used by the equivalent list endpoints. Register the base-item routes in `backend/games/urls/games.py`; extend `_CHARACTER_ROUTES` in `backend/games/urls/_character_routes.py` with `items/<int:item_id>.json` and `items/<int:item_id>/all.json` for the PC/NPC routes — the shared builder already supports an extra id segment past `character_id` (see the existing `/photos/<int:photo_id>/set.json` entry), so no per-kind `urls.py` changes are needed.

Frontend: add the three routes to `HashRouteResolver.js`, add a new item detail page component using a simplified version of the two-column layout from `CharacterDetail.jsx` (photo+name / description only), and update `buildNullItemHref` (`listTypeConfig.js`) and any equivalent card-link builder to point at the new pages instead of always returning `null`.

## Benefits
Lets users (and DMs) drill into a specific item's full details, including hidden items when authorized, and makes previously non-clickable item cards throughout the app actually navigable.

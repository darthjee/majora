# Issue: Add missing routes to the Navi cache warmer

## Description
The Navi cache warmer config (`.circleci/navi_config.yaml`) does not cover several existing API endpoints, and two existing preview resources use an outdated `per_page` value. Separately, the frontend's PC/NPC treasures/items preview does not request a bounded page size, which also blocks a proper preview cache entry for those resources.

## Problem
- `short_game_pcs` and `short_game_npcs` warm `/games/{:slug}/pcs.json?per_page=6` and `/games/{:slug}/npcs.json?per_page=6`, but the frontend's game-page PC/NPC preview now requests `per_page=5` (`GameController.js`). The warmed URL no longer matches what the frontend actually requests, so that preview is served from origin instead of cache.
- The cache warmer does not warm PC/NPC treasures, PC/NPC items, or game-level items endpoints at all, so these pages hit the (uncached) origin on first request after each production release.
- On PC/NPC detail pages, the treasures/items preview (`CharacterHelper.jsx`) is fed by `CharacterClient.fetchCharacterTreasures`/`fetchCharacterItems` — the shared client methods responsible for populating that preview. Unlike the game page's PC/NPC preview, which requests `per_page=${MAX_PREVIEW_ITEMS}` explicitly (`GameController.js`), these methods fetch the endpoint's default page and rely on client-side truncation to 5 items (`PreviewSectionHelper.jsx`). This over-fetches data and means there is no distinct, warmable `per_page=5` URL for these previews.

## Solution

### Frontend
`CharacterClient.fetchCharacterTreasures`/`fetchCharacterItems` (`frontend/assets/js/client/CharacterClient.js`) are the shared methods responsible for the preview fetch, so the `per_page=5` default belongs there, not in each call site — mirroring `MAX_PREVIEW_ITEMS` usage in `GameController.js`. Once fixed, these become real, distinct, warmable URLs:
- `/games/{:slug}/pcs/{:id}/treasures.json?per_page=5`
- `/games/{:slug}/npcs/{:id}/treasures.json?per_page=5`
- `/games/{:slug}/pcs/{:id}/items.json?per_page=5`
- `/games/{:slug}/npcs/{:id}/items.json?per_page=5`

### Cache warmer (`.circleci/navi_config.yaml`)
1. Fix `per_page` on the existing preview resources:
   - `short_game_pcs`: `/games/{:slug}/pcs.json?per_page=6` -> `per_page=5`
   - `short_game_npcs`: `/games/{:slug}/npcs.json?per_page=6` -> `per_page=5`

2. Add full paginated resources (mirroring `pc_photos`/`npc_photos`/`game_treasures`; note these correct the malformed paths from the original request, e.g. real route is `/pcs/{:id}/treasures.json`, not `/pcs.json/{:id}/treasures.json`):
   - `pc_treasures`: `/games/{:slug}/pcs/{:id}/treasures.json`, action of `pc`
   - `npc_treasures`: `/games/{:slug}/npcs/{:id}/treasures.json`, action of `npc`
   - `pc_items`: `/games/{:slug}/pcs/{:id}/items.json`, action of `pc`
   - `npc_items`: `/games/{:slug}/npcs/{:id}/items.json`, action of `npc`
   - `game_items`: `/games/{:slug}/items.json`, action of `paginated_games`

3. Add preview (`per_page=5`) resources (mirroring `short_game_pcs`/`short_game_npcs`), matching the frontend fix above:
   - `short_pc_treasures`: `/games/{:slug}/pcs/{:id}/treasures.json?per_page=5`, action of `pc`
   - `short_npc_treasures`: `/games/{:slug}/npcs/{:id}/treasures.json?per_page=5`, action of `npc`
   - `short_pc_items`: `/games/{:slug}/pcs/{:id}/items.json?per_page=5`, action of `pc`
   - `short_npc_items`: `/games/{:slug}/npcs/{:id}/items.json?per_page=5`, action of `npc`

## Benefits
- Frontend's character preview stops over-fetching a full page just to show 5 items, matching the leaner pattern already used for game-page previews.
- Cache warmer covers real, distinct URLs the frontend actually requests, so previews are served from cache instead of hitting origin after each release.

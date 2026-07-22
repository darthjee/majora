# Issue: Request page data through the new RequestStore

## Description
`RequestStore` (`frontend/assets/js/utils/requests/RequestStore.js`) was added in #778/#790 as a structure-only, permission-aware, cached data-fetching layer for resources (mirroring the existing `AccessStore`/`AccessCache` pattern). It currently has zero callers anywhere in the app. This issue wires it in across the games/home area of the app: single-resource show pages, list pages, edit pages, and page-embedded components that fetch their own data should all fetch through `RequestStore.ensure()` instead of calling API clients directly. No resource or page is excluded — pcs/npcs are fully in scope, including the pc/npc preview widget embedded in the Game show page.

## Problem
Data fetching is currently done through three separate, ad hoc patterns, none of which get `RequestStore`'s caching/dedup/permission-resync behavior, and all of which duplicate per-resource endpoint/permission knowledge that `resourceConfig.js` already centralizes:
- Show pages: each page's `XController.js` calls `client.fetch(...)` directly in `buildEffect()` (e.g. `GameController` fetching `/games/${slug}.json`).
- List pages (`Games`/home, `GameTreasures`, `GameItems`, `GamePcs`, `GameNpcs`, per-character treasure/document lists): go through the separate `ListPageController`/`listTypeConfig` abstraction.
- Page-embedded components with their own independent fetch, decoupled from their parent page's data: `GamePreviewSections` (pc/npc preview lists on the Game show page, fetched inside `GameController`), `TreasureExchangeModal` (treasure browse/sell lists on PC/NPC show pages), `AddGameTreasureModal` (on the `GameTreasures` list page).

## Expected Behavior
All of the following should fetch their data via `RequestStore.ensure({resource, quantityType, params})` using `resourceConfig.js`'s `single`/`collection` entries, instead of their current direct client calls:

**Show pages** (single quantity type) — all originally listed routes, no pcs/npcs exclusion:
- `/#/`, `/#/games`, `/#/games/:game_slug`
- `/#/games/:game_slug/treasures/:id`, `/#/games/:game_slug/items/:id`
- `/#/games/:game_slug/pcs/:id`, `/#/games/:game_slug/pcs/:id/items/:id`
- `/#/games/:game_slug/npcs/:id`, `/#/games/:game_slug/npcs/:character_id/items/:id`

**List pages** (collection quantity type):
- `/#/games` and `/#/` (Games/home list), `/#/games/:game_slug/treasures`, `/#/games/:game_slug/items`
- `/#/games/:game_slug/pcs`, `/#/games/:game_slug/npcs`
- `/#/games/:game_slug/pcs/:id/treasures`, `/#/games/:game_slug/pcs/:id/documents`
- `/#/games/:game_slug/npcs/:id/treasures`, `/#/games/:game_slug/npcs/:id/documents`

**Edit pages** (reuse the same resource fetch as their show page, plus edit-permission merge):
- Game edit, standalone treasure edit, per-game treasure edit, game item edit
- Pc/Npc character edit, Pc/Npc character item edit
- Game session edit — note: `resourceConfig.js` currently only has `game`/`npc`/`pc`/`item`/`treasure` configs, so a new session resource config will need to be added for this one

**Page-embedded components** (fetch independently of their parent page, in scope per broadened decision):
- `GamePreviewSections` (pc/npc preview lists on the Game show page)
- `TreasureExchangeModal` (treasure browse/sell lists on PC/NPC show pages)
- `AddGameTreasureModal` (on the `GameTreasures` list page)

## Solution
For each item above, replace the current direct `client.fetch(...)` / `ListPageController`/`listTypeConfig` call with the equivalent `RequestStore.ensure(...)` call, using the resource configs in `resourceConfig.js` (adding a session config where missing). Only the data-fetching call is swapped — the resulting data shape, Helper rendering, and `ShowPageLayout`/list rendering are unchanged. Character edit pages that already delegate loading to their show page's controller (`BaseCharacterEditController`) get this for free once the underlying show-page controller migrates.

## Benefits
- Consistent, cached, permission-aware fetching across show pages, list pages, edit pages, and embedded components
- Removes duplicated endpoint/permission knowledge from individual controllers
- Collapses three separate ad hoc fetching patterns down to one

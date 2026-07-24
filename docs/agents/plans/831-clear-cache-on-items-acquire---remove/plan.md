# Plan: Clear cache on items acquire / remove

Issue: [831-clear-cache-on-items-acquire---remove.md](../../issues/831-clear-cache-on-items-acquire---remove.md)

## Overview
Consolidate the character-scoped treasures and items cache-cleanup groups that currently live inside `pcs.php`/`npcs.php` into `treasures.php`/`items.php`, then add cache-cleanup groups for the character item `acquire`, `acquire/all`, `remove`, and `remove/all` routes (PCs and NPCs), bringing items to parity with how treasures already invalidate cache. This is a proxy-only change (PHP cache-cleanup configuration under `proxy/extension/lib/configuration/cache_cleanup/`); no backend, frontend, or API surface changes are involved.

## Context
- `cache_cleanup_map.php` merges per-family group arrays (`npcs.php`, `pcs.php`, `treasures.php`, `sessions.php`, `items.php`) into a single `$cacheCleanupMap`, consumed by `CacheCleanupMiddleware`'s `custom` option.
- `pcs.php`/`npcs.php` each define a `$pcsEntityTargets`/`$npcsEntityTargets` array (the PC/NPC's own `detail`/`full`/`photos` cache paths) and currently embed two extra groups per file:
  - A "treasures buy/sell/acquire/remove" group: targets = entity targets + `.../treasures.json`, routes = `treasures/buy.json`, `treasures/sell.json`, `treasures/acquire.json`, `treasures/acquire/all.json`, `treasures/remove.json`.
  - A "items" group: targets = `.../items.json`, `.../items/all.json`, `.../items/:item_id.json`, `.../items/:item_id/full.json`, routes = `items/:item_id.json` (update) and `items/:item_id/photo_upload.json`.
- `treasures.php` and `items.php` today only hold the entity-family-wide groups (global treasure list/detail, and the game-wide item entity group) — they don't yet know about the character-scoped groups above.
- The backend already exposes all four item routes per character kind (see `backend/games/urls/_character_routes.py`): `items/acquire.json`, `items/acquire/all.json`, `items/remove.json`, `items/remove/all.json` — none of them currently clear any cache.
- `proxy/extension/tests/configuration/CacheCleanupMapTest.php` asserts directly against `$cacheCleanupMap` entries per route (e.g. `testPcItemUpdateClearsAllPcItemCacheTargets`) — this is the pattern to follow for new/changed assertions.

## Implementation Steps

### Step 1 — Move the character-scoped treasures group out of pcs.php/npcs.php into treasures.php
In `treasures.php`, add two new groups (one for pcs, one for npcs) equivalent to the ones currently in `pcs.php`/`npcs.php`:
- targets: the PC/NPC entity targets (`.../pcs/:character_id.json`, `.../full.json`, `.../photos.json`, and for npcs also `.../npcs.json`/`.../npcs/all.json` as currently defined by `$pcsEntityTargets`/`$npcsEntityTargets`) plus `.../pcs/:character_id/treasures.json` (or the npcs equivalent).
- routes: `treasures/buy.json`, `treasures/sell.json`, `treasures/acquire.json`, `treasures/acquire/all.json`, `treasures/remove.json`, scoped to `pcs`/`npcs` respectively.

Since `treasures.php` doesn't currently define the PC/NPC entity target lists, either export `$pcsEntityTargets`/`$npcsEntityTargets` from `pcs.php`/`npcs.php` for reuse (e.g. by having those files `return` the array *and* assign it to a variable available via `require`, or by extracting the shared literal path lists into a small helper included by both), or inline the literal paths directly in `treasures.php` — match whichever style keeps the file self-contained and consistent with the rest of the codebase (existing files favor a top-of-file `$xEntityTargets` array, so prefer sharing that constant over re-deriving it). Then remove these groups from `pcs.php`/`npcs.php`.

### Step 2 — Move the character-scoped items group out of pcs.php/npcs.php into items.php, and extend it
In `items.php`, add two new groups (pcs, npcs) that combine what's currently in `pcs.php`/`npcs.php`'s "items" group with the new acquire/remove routes:
- targets: `.../items.json`, `.../items/all.json`, `.../items/:item_id.json`, `.../items/:item_id/full.json` (same as today) for the `item_detail`/`photo_upload` routes.
- a second (or merged) group for `acquire`/`acquire/all`/`remove`/`remove/all`: targets `.../items.json` and `.../items/all.json` only (there is no `item_id` available on these routes to target the entity-detail caches directly).

Routes to cover, for both pcs and npcs:
- `POST /games/:game_slug/pcs/:character_id/items/acquire.json`
- `POST /games/:game_slug/pcs/:character_id/items/acquire/all.json`
- `POST /games/:game_slug/pcs/:character_id/items/remove.json`
- `POST /games/:game_slug/pcs/:character_id/items/remove/all.json`
- `POST /games/:game_slug/npcs/:character_id/items/acquire.json`
- `POST /games/:game_slug/npcs/:character_id/items/acquire/all.json`
- `POST /games/:game_slug/npcs/:character_id/items/remove.json`
- `POST /games/:game_slug/npcs/:character_id/items/remove/all.json`

Remove the old "items" group from `pcs.php`/`npcs.php` once its routes/targets are covered by the new groups in `items.php`.

### Step 3 — Clean up pcs.php/npcs.php
After Steps 1–2, `pcs.php`/`npcs.php` should only retain the groups for routes unique to the PC/NPC entity itself (`detail`/`full`/`photo_upload`, and for npcs the `npcs.json` collection group). Update the file-level doc comments if they reference the removed groups.

### Step 4 — Update/add tests
In `proxy/extension/tests/configuration/CacheCleanupMapTest.php` (or a new test file if it grows too large):
- Verify existing treasures buy/sell/acquire/remove assertions (add them if missing) still resolve to the same target lists after the move to `treasures.php`.
- Verify existing item update/photo-upload assertions (`testPcItemUpdateClearsAllPcItemCacheTargets`, `testNpcItemUpdateClearsAllNpcItemCacheTargets`, etc.) still pass unchanged.
- Add new tests asserting `$cacheCleanupMap` entries for all 8 new routes (pcs/npcs × acquire/acquire-all/remove/remove-all), following the existing `test<Route>Clears...CacheTargets` naming convention.
- Also check `proxy/extension/tests/middlewares/CacheCleanupMapBuilderTest.php` for any fixture that duplicates the pcs/npcs/treasures/items group shape and update it if it would otherwise go stale.

## Files to Change
- `proxy/extension/lib/configuration/cache_cleanup/pcs.php` — remove the embedded treasures and items groups, keep only PC-entity-unique groups.
- `proxy/extension/lib/configuration/cache_cleanup/npcs.php` — same, for NPCs.
- `proxy/extension/lib/configuration/cache_cleanup/treasures.php` — gain the pcs/npcs character-scoped treasures groups.
- `proxy/extension/lib/configuration/cache_cleanup/items.php` — gain the pcs/npcs character-scoped items groups, extended with acquire/acquire-all/remove/remove-all.
- `proxy/extension/tests/configuration/CacheCleanupMapTest.php` — add/update assertions per Step 4.
- `proxy/extension/tests/middlewares/CacheCleanupMapBuilderTest.php` — check and update if needed.

## Notes
- No CircleCI job currently runs the proxy PHPUnit suite (only python/js checks and proxy *deployment* jobs are wired into `.circleci/config.yml`), so run tests locally, e.g. via `docker-compose run proxy_tests` (per the doc-comment in `CacheCleanupMapTest.php`) or the project's equivalent PHPUnit entrypoint, before considering this done.
- Treasures currently has no cache clearing on `treasures/buy/all.json` (only `buy.json`, `sell.json`, `acquire.json`, `acquire/all.json`, `remove.json` are covered) — this looks like a pre-existing gap unrelated to this issue; do not fix it here unless it becomes a trivial side effect of the refactor, since it's out of scope.
- Decide during implementation whether sharing `$pcsEntityTargets`/`$npcsEntityTargets` across files is done via `require`-ing `pcs.php`/`npcs.php` for their variable side-effect, restructuring them to return a keyed array (`['entityTargets' => ..., 'groups' => ...]`), or simply inlining literal paths in `treasures.php`/`items.php` — pick whichever keeps `cache_cleanup_map.php`'s simple `require`-and-`array_merge` pattern intact.

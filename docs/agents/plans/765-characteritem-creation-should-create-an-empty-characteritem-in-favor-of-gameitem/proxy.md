# Proxy Plan: CharacterItem creation should create an empty CharacterItem in favor of GameItem

Main plan: [plan.md](plan.md)

## Shared contracts

- Must list the `backend`-renamed single-entity item path (`.../items/:item_id/full.json`, both character-scoped and game-scoped) as a cache target wherever the old `.../items/:item_id/all.json` was listed, so cache invalidation keeps working after the rename. This is purely a string update to existing target lists — no new trigger routes.

## Implementation Steps

### Step 1 — Update items cache-cleanup targets

`proxy/extension/lib/configuration/cache_cleanup/items.php:21` — in the `targets` list for the items entity family group, change `'/games/:game_slug/items/:item_id/all.json'` to `'/games/:game_slug/items/:item_id/full.json'`.

### Step 2 — Update pcs cache-cleanup targets

`proxy/extension/lib/configuration/cache_cleanup/pcs.php:48` — in the "pcs items" group's `targets` list, change `'/games/:game_slug/pcs/:character_id/items/:item_id/all.json'` to `.../full.json`.

### Step 3 — Update npcs cache-cleanup targets

`proxy/extension/lib/configuration/cache_cleanup/npcs.php:60` (the "npcs items" group's `targets` list) — same change: `'/games/:game_slug/npcs/:character_id/items/:item_id/all.json'` → `.../full.json`.

### Step 4 — Update tests

`proxy/extension/tests/configuration/CacheCleanupMapTest.php` — update the three assertions that include the old path as a literal target string:
- `testItemPhotoUploadClearsAllItemCacheTargets` (line 58) — `'/games/:game_slug/items/:item_id/all.json'` → `.../full.json`.
- `testPcItemPhotoUploadClearsAllPcItemCacheTargets` (line 74) — `'/games/:game_slug/pcs/:character_id/items/:item_id/all.json'` → `.../full.json`.
- `testNpcItemPhotoUploadClearsAllNpcItemCacheTargets` (line 90) — `'/games/:game_slug/npcs/:character_id/items/:item_id/all.json'` → `.../full.json`.

## Files to Change

- `proxy/extension/lib/configuration/cache_cleanup/items.php` — target path rename.
- `proxy/extension/lib/configuration/cache_cleanup/pcs.php` — target path rename.
- `proxy/extension/lib/configuration/cache_cleanup/npcs.php` — target path rename.
- `proxy/extension/tests/configuration/CacheCleanupMapTest.php` — updated assertions.

## Notes

- No CircleCI job runs these PHPUnit tests (deploy-only pipeline for `proxy/`); run locally via `docker-compose run proxy_tests` before considering this done.
- The collection-level `/games/:game_slug/items/all.json` (and pcs/npcs equivalents) targets are unaffected — only the `:item_id/all.json` single-entity targets change.
- `CacheCleanupMapBuilderTest.php` was checked and does not reference the item detail-all path, only unrelated npcs examples — no change needed there.

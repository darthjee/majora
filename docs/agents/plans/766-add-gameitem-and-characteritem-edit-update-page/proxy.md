# Proxy Plan: Add GameItem and CharacterItem edit/update page

Main plan: [plan.md](plan.md)

## Shared contracts

- `.../items/:id.json` (all three scopes: game, pcs, npcs) becomes a mutating (PATCH) route for the first time, on top of already being a cached GET target. It must be added to the corresponding cache-cleanup group's `routes` (trigger) list — mirroring how `.../pcs/:character_id.json` and `.../npcs/:character_id.json` already appear in both `targets` and `routes` today for the same reason (they're both GET-cached and PATCH-mutating).
- No target-path changes — the existing target lists in each group already cover the right paths; only a new trigger route needs adding to each.
- Assumes #765 has already renamed `all.json` → `full.json` in these same files' target lists — this plan only adds new entries, it doesn't touch the renamed ones.

## Implementation Steps

### Step 1 — items.php

`proxy/extension/lib/configuration/cache_cleanup/items.php` — in the items-family group's `routes` array (currently only `'/games/:game_slug/items/:item_id/photo_upload.json'`), add:
```php
'/games/:game_slug/items/:item_id.json',
```

### Step 2 — pcs.php

`proxy/extension/lib/configuration/cache_cleanup/pcs.php` — in the "pcs items" group's `routes` array (currently only the photo-upload trigger), add:
```php
'/games/:game_slug/pcs/:character_id/items/:item_id.json',
```

### Step 3 — npcs.php

`proxy/extension/lib/configuration/cache_cleanup/npcs.php` — in the "npcs items" group's `routes` array (currently only the photo-upload trigger), add:
```php
'/games/:game_slug/npcs/:character_id/items/:item_id.json',
```

### Step 4 — Tests

`proxy/extension/tests/configuration/CacheCleanupMapTest.php` — add three new tests mirroring the existing `test{Item,PcItem,NpcItem}PhotoUploadClearsAll{...}CacheTargets` (lines ~50, ~66, ~82), asserting that PATCHing `.../items/:item_id.json` clears the same target lists as the photo-upload trigger already does:
- `testItemUpdateClearsAllItemCacheTargets`
- `testPcItemUpdateClearsAllPcItemCacheTargets`
- `testNpcItemUpdateClearsAllNpcItemCacheTargets`

## Files to Change

- `proxy/extension/lib/configuration/cache_cleanup/items.php` — new trigger route.
- `proxy/extension/lib/configuration/cache_cleanup/pcs.php` — new trigger route.
- `proxy/extension/lib/configuration/cache_cleanup/npcs.php` — new trigger route.
- `proxy/extension/tests/configuration/CacheCleanupMapTest.php` — 3 new tests.

## Notes

- No CircleCI job runs these PHPUnit tests (deploy-only pipeline for `proxy/`); run locally via `docker-compose run proxy_tests` before considering this done.
- `CacheCleanupMapBuilderTest.php` was not found to need changes for this issue (same conclusion as #765's proxy plan) — confirm at implementation time.

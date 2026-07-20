# Proxy Plan: Add Game Item photo upload

Main plan: [plan.md](plan.md)

## Shared contracts

Depends on backend's new route existing (`/games/:game_slug/items/:item_id/photo_upload.json`)
— purely as a static path-pattern string in this config, no runtime coupling. Implements the
cache-cleanup contract from `plan.md`: this route, when hit, purges the four item list/detail
targets listed there. `dev_configuration/rules/backend.php` and
`prod_configuration/rules/backend.php` both already wire `CacheCleanupMiddleware` to the shared
`$cacheCleanupMap` built in `cache_cleanup_map.php` — no per-environment rule file changes
needed, only the shared config below.

## Implementation Steps

### Step 1 — New `items.php` cache-cleanup group

Add `proxy/extension/lib/configuration/cache_cleanup/items.php`, mirroring
`pcs.php`/`npcs.php`'s shape (a `$itemsEntityTargets` list reused as the single group's
`targets`, since — unlike `pcs.php`, which has a second treasures-acquire group — there's only
one mutating route to cover here):

```php
<?php
/**
 * Cache-cleanup groups for the items resource family, consumed by
 * cache_cleanup_map.php to build $cacheCleanupMap.
 *
 * Each group pairs a shared list of cache-target paths ('targets') with the
 * list of trigger routes ('routes') that, when hit by a mutating request,
 * clear those targets. Groups sharing a resource family's base target list
 * extend it rather than repeating it, per docs/agents/issues/438-reactor-proxy-rules.md.
 *
 * @return array List of items-family cache-cleanup groups.
 */

return [
    // items entity family — routes mutating a single GameItem.
    [
        'targets' => [
            '/games/:game_slug/items.json',
            '/games/:game_slug/items/all.json',
            '/games/:game_slug/items/:item_id.json',
            '/games/:game_slug/items/:item_id/all.json',
        ],
        'routes' => [
            '/games/:game_slug/items/:item_id/photo_upload.json',
        ],
    ],
];
```

### Step 2 — Register it in `cache_cleanup_map.php`

Edit `proxy/extension/lib/configuration/cache_cleanup/cache_cleanup_map.php`: add
`$itemsCacheCleanupGroups = require __DIR__ . '/items.php';` alongside the existing
`$npcsCacheCleanupGroups`/`$pcsCacheCleanupGroups`/`$treasuresCacheCleanupGroups`/
`$sessionsCacheCleanupGroups` lines, and add it to the `array_merge(...)` call building
`$cacheCleanupGroups`.

### Step 3 — Test

Extend `proxy/extension/tests/configuration/CacheCleanupMapTest.php` (mirroring its existing
`testPollCloseClearsAllSessionCacheTargets`) with a new test asserting
`$map['/games/:game_slug/items/:item_id/photo_upload.json']` equals the four targets from
Step 1, in order.

## Files to Change

- `proxy/extension/lib/configuration/cache_cleanup/items.php` — new file.
- `proxy/extension/lib/configuration/cache_cleanup/cache_cleanup_map.php` — require + merge
  the new group.
- `proxy/extension/tests/configuration/CacheCleanupMapTest.php` — new assertion.

## CI Checks

No dedicated CircleCI job runs the PHP proxy test suite (`.circleci/config.yml` only has
`upload_proxy_files`/`copy_proxy_configuration`, which are deployment steps, not tests) — run
locally instead: `docker-compose run proxy_tests` (per the docblock in
`CacheCleanupMapTest.php` and the `command: vendor/bin/phpunit extension/tests` entry in
`docker-compose.yml`).

## Notes

- `treasures.php`'s existing entity group does **not** list its own `photo_upload.json` as a
  trigger route (only the treasure detail `PATCH` route is), unlike `pcs.php`/`npcs.php`, which
  both do. This looks like a pre-existing gap in the treasure family, not a deliberate pattern
  to replicate — `items.php` here follows `pcs.php`/`npcs.php`'s more complete precedent
  (`photo_upload.json` included as a trigger). Flag this treasures.php gap to the user/architect
  as a possible separate follow-up issue rather than silently fixing it here (out of scope for
  #749).

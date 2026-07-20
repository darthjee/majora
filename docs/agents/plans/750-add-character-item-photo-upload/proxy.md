# Proxy Plan: Add Character Item Photo Upload

Main plan: [plan.md](plan.md)

## Shared contracts

Depends on backend's two new routes existing
(`/games/:game_slug/pcs/:character_id/items/:item_id/photo_upload.json` and the `/npcs/`
equivalent) — purely as static path-pattern strings in this config, no runtime coupling.
Implements the cache-cleanup contract from `plan.md`: each route, when hit, purges its kind's
four item list/detail targets. `dev_configuration/rules/backend.php` and
`prod_configuration/rules/backend.php` both already wire `CacheCleanupMiddleware` to the shared
`$cacheCleanupMap` built in `cache_cleanup_map.php` — no per-environment rule file changes
needed, only the two family config files below.

## Implementation Steps

### Step 1 — Add an items group to `pcs.php`

Edit `proxy/extension/lib/configuration/cache_cleanup/pcs.php`: add a new group after the
existing "treasures acquire/sell" group, following the same shape (its own target list, since
the item routes are independent of the PC's own entity/photo targets):

```php
    // pcs items — a PC's item photo-upload route.
    [
        'targets' => [
            '/games/:game_slug/pcs/:character_id/items.json',
            '/games/:game_slug/pcs/:character_id/items/all.json',
            '/games/:game_slug/pcs/:character_id/items/:item_id.json',
            '/games/:game_slug/pcs/:character_id/items/:item_id/all.json',
        ],
        'routes' => [
            '/games/:game_slug/pcs/:character_id/items/:item_id/photo_upload.json',
        ],
    ],
```

(inserted as an additional array element in the `return [...]` list, alongside the existing pcs
entity and treasures acquire/sell groups.)

### Step 2 — Add an items group to `npcs.php`

Same shape in `proxy/extension/lib/configuration/cache_cleanup/npcs.php`, under `/npcs/`:

```php
    // npcs items — an NPC's item photo-upload route.
    [
        'targets' => [
            '/games/:game_slug/npcs/:character_id/items.json',
            '/games/:game_slug/npcs/:character_id/items/all.json',
            '/games/:game_slug/npcs/:character_id/items/:item_id.json',
            '/games/:game_slug/npcs/:character_id/items/:item_id/all.json',
        ],
        'routes' => [
            '/games/:game_slug/npcs/:character_id/items/:item_id/photo_upload.json',
        ],
    ],
```

### Step 3 — Test

No `cache_cleanup_map.php` changes are needed — `pcs.php`/`npcs.php` are already `require`d and
merged there. Extend `proxy/extension/tests/configuration/CacheCleanupMapTest.php` (mirroring
its existing PC/NPC assertions) with two new tests asserting
`$map['/games/:game_slug/pcs/:character_id/items/:item_id/photo_upload.json']` and the `/npcs/`
equivalent each equal their four targets from Steps 1–2, in order.

## Files to Change

- `proxy/extension/lib/configuration/cache_cleanup/pcs.php` — new items group.
- `proxy/extension/lib/configuration/cache_cleanup/npcs.php` — new items group.
- `proxy/extension/tests/configuration/CacheCleanupMapTest.php` — two new assertions.

## CI Checks

No dedicated CircleCI job runs the PHP proxy test suite (`.circleci/config.yml` only has
`upload_proxy_files`/`copy_proxy_configuration`, which are deployment steps, not tests) — run
locally instead: `docker-compose run proxy_tests` (per the `command: vendor/bin/phpunit
extension/tests` entry in `docker-compose.yml`).

## Notes

- Unlike #749's standalone new `items.php` file (a top-level game resource with no existing
  family file), PC/NPC items are sub-resources of an existing family that already has its own
  `pcs.php`/`npcs.php` — so this plan adds a group to each, following the in-file precedent
  already set by their own "treasures acquire/sell" groups, rather than introducing a third
  shared file.

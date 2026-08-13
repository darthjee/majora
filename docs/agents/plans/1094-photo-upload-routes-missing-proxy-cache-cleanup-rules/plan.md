# Plan: Photo upload routes missing proxy cache-cleanup rules

Issue: [1094-photo-upload-routes-missing-proxy-cache-cleanup-rules.md](../../issues/1094-photo-upload-routes-missing-proxy-cache-cleanup-rules.md)

## Overview

Four `photo_upload.json` routes have no entry in the proxy's cache-cleanup config
(`proxy/extension/lib/configuration/cache_cleanup/`), so the cached GET responses for
their owning resource stay stale until TTL expiry after a photo is uploaded. This plan
adds the missing cache-cleanup groups — three new per-family files plus one addition to
an existing file — following the exact `targets`/`routes` group pattern already used by
`items.php`, `pcs.php`, `npcs.php`, `documents.php`, and `sessions.php`, and adds unit
tests mirroring the existing ones in `CacheCleanupMapTest.php`. This is entirely proxy
(PHP) work — no backend, frontend, or Navi changes are needed.

## Context

`cache_cleanup_map.php` merges resource-family group arrays (via `CacheCleanupMapBuilder`)
from `npcs.php`, `pcs.php`, `treasures.php`, `sessions.php`, `items.php`, and
`documents.php`. Each group is `{'targets' => [...cached GET paths...], 'routes' =>
[...mutating routes that trigger a purge of those targets...]}`. `CacheCleanupMapBuilder`
merges groups by route, so a route hit by two groups clears the union of both groups'
targets (see `testNpcTreasureBuyClearsAllNpcTreasureCacheTargets` in
`CacheCleanupMapTest.php` for an example of this union behavior).

None of the six existing files has a group whose `routes` includes any of:
- `games/:game_slug/photo_upload.json` (game's own cover photo)
- `treasures/:treasure_id/photo_upload.json` (treasure photo)
- `games/:game_slug/factions/:faction_id/photo_upload.json` (faction photo)
- `games/:game_slug/possessions/:possession_id/photo_upload.json` (game possession photo)

## Implementation Steps

### Step 1 — Add `factions.php`

Create `proxy/extension/lib/configuration/cache_cleanup/factions.php`, modeled on
`documents.php`'s single-group shape (no character-scoping needed):

```php
return [
    [
        'targets' => [
            '/games/:game_slug/factions.json',
            '/games/:game_slug/factions/:faction_id.json',
        ],
        'routes' => [
            '/games/:game_slug/factions/:faction_id.json',
            '/games/:game_slug/factions/:faction_id/photo_upload.json',
        ],
    ],
];
```

(Confirm against `backend/games/urls/games.py` whether a faction detail-mutation route
actually exists at `games/:game_slug/factions/:faction_id.json` — if not, drop it from
`routes` and keep only the photo_upload trigger.)

### Step 2 — Add `possessions.php`

Create `proxy/extension/lib/configuration/cache_cleanup/possessions.php`:

```php
return [
    [
        'targets' => [
            '/games/:game_slug/possessions.json',
            '/games/:game_slug/possessions/all.json',
            '/games/:game_slug/possessions/:possession_id.json',
            '/games/:game_slug/possessions/:possession_id/full.json',
        ],
        'routes' => [
            '/games/:game_slug/possessions/:possession_id.json',
            '/games/:game_slug/possessions/:possession_id/photo_upload.json',
        ],
    ],
];
```

(Same caveat as Step 1 — confirm the exact set of mutating routes for a single
`GamePossession` against `backend/games/urls/games.py` before finalizing `routes`.)

### Step 3 — Add `games.php`

Create `proxy/extension/lib/configuration/cache_cleanup/games.php`. `GameListSerializer`
(used by both `games.json` and, via `MyGamesItemSerializer`, `my-games.json`) embeds
`photo_path`, so both list endpoints need to be targets alongside game detail:

```php
return [
    [
        'targets' => [
            '/games.json',
            '/my-games.json',
            '/games/:game_slug.json',
        ],
        'routes' => [
            '/games/:game_slug/photo_upload.json',
        ],
    ],
];
```

Scope this group's `routes` to the photo_upload route only — do not add the game detail
PATCH route here. Editing a game's own detail (renaming, etc.) not being cache-cleaned is
a separate pre-existing gap, out of scope for this issue (see the issue file's Scope
section).

### Step 4 — Extend `treasures.php`

Add the photo_upload trigger route to the existing entity-family group (the one whose
`targets` already includes both `/games/:game_slug/treasures/:treasure_id.json` and
`/treasures/:treasure_id.json`):

```php
    // treasures entity — a single treasure.
    [
        'targets' => [
            '/games/:game_slug/treasures.json',
            '/games/:game_slug/treasures/:treasure_id.json',
            '/treasures/:treasure_id.json',
        ],
        'routes' => [
            '/games/:game_slug/treasures/:treasure_id.json',
            '/treasures/:treasure_id/photo_upload.json',
        ],
    ],
```

### Step 5 — Register the new files in `cache_cleanup_map.php`

Add `require` + array entries for `factions.php`, `possessions.php`, and `games.php`,
following the exact pattern already used for the six existing families (`require` at the
top, then include the resulting variable in the `array_merge(...)` call).

### Step 6 — Add tests

In `proxy/extension/tests/configuration/CacheCleanupMapTest.php`, add one test per new
trigger route (4 new tests, following the existing
`testItemPhotoUploadClearsAllItemCacheTargets`-style pattern: build the map, assert
`$map['/exact/route']` equals the exact ordered target array). Also check whether
`CacheCleanupMapBuilderTest.php` needs anything — it tests the builder in isolation, so it
likely needs no changes, but confirm during implementation.

## Files to Change

- `proxy/extension/lib/configuration/cache_cleanup/factions.php` — new file (Step 1)
- `proxy/extension/lib/configuration/cache_cleanup/possessions.php` — new file (Step 2)
- `proxy/extension/lib/configuration/cache_cleanup/games.php` — new file (Step 3)
- `proxy/extension/lib/configuration/cache_cleanup/treasures.php` — add photo_upload
  route to the existing treasure-entity group (Step 4)
- `proxy/extension/lib/configuration/cache_cleanup/cache_cleanup_map.php` — require and
  merge the 3 new files (Step 5)
- `proxy/extension/tests/configuration/CacheCleanupMapTest.php` — add 4 new tests
  (Step 6)

## CI Checks

- `proxy/extension`: `vendor/bin/phpunit --bootstrap /var/www/html/extension/tests/bootstrap.php /var/www/html/extension/tests` (CI job: `proxy_extension_tests`)

## Notes

- The exact `routes` list for the faction and possession groups (Steps 1–2) needs a
  final check against `backend/games/urls/games.py` at implementation time — this plan
  captures the photo_upload trigger with confidence, but whether a bare detail-mutation
  route (e.g. `PATCH games/:game_slug/factions/:faction_id.json`) also exists and should
  be listed alongside it should be verified rather than assumed.
- Miniatures (`CollectionPhoto`, `SourcePhoto`, `StlModelPhoto`) are explicitly out of
  scope — not included in `navi/navi_config.yaml`, so not proxy-cached at all.
- The pre-existing gap where editing a game's own detail (PATCH) doesn't clear cache
  either is explicitly out of scope for this issue (see Step 3) — worth a follow-up issue
  if it's ever prioritized.

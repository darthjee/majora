# Issue: Photo upload routes missing proxy cache-cleanup rules

## Description

Several `photo_upload.json` endpoints are not wired into the proxy's cache-cleanup
configuration (`proxy/extension/lib/configuration/cache_cleanup/*.php`, consumed by
`CacheCleanupMiddleware` via `cache_cleanup_map.php`). This is the mechanism that purges
cached GET responses when a mutating route is hit — separate from Navi's cache warmer and
from the backend's `CacheControlMiddleware`/`@restricted`/`@skip_cache` decorators, which
only decide whether a response is cacheable in the first place, not when to invalidate it.

This was originally reported as "faction photo upload needs to be fixed," referencing
issue #1088 / PR #1091 (commit `1f3408de`). That PR fixed the backend permission/handler
logic for `FactionPhoto` and `GamePossessionPhoto` uploads, but never added the
corresponding proxy cache-cleanup entries — so the underlying symptom (stale photo after
upload) persisted. A full audit of every `photo_upload.json` route against the
cache-cleanup config surfaced three more routes with the same gap, unrelated to #1088.

## Problem

`proxy/extension/lib/configuration/cache_cleanup/` currently defines groups for the
`npcs`, `pcs`, `treasures` (collection/detail only, not photo), `items`, `documents`, and
`sessions` resource families. Each group pairs a `targets` list (cached GET paths to purge)
with a `routes` list (mutating routes that trigger the purge) — see `items.php` or
`pcs.php` for the established pattern (character/item photo_upload routes are listed as
trigger routes alongside the entity's own detail-mutation route).

The following `photo_upload.json` routes have no group anywhere in this config, so hitting
them clears nothing — the cached GET response for the owning resource (and its listing)
keeps serving the stale, pre-upload state until the cache entry's TTL expires:

| # | Route | Backend view | Notes |
|---|-------|--------------|-------|
| 1 | `games/:game_slug/photo_upload.json` | `games.views.games.photo_upload` (`game-photo-upload`) | Game's own cover photo. Pre-existing gap, unrelated to #1088. |
| 2 | `treasures/:treasure_id/photo_upload.json` | `treasure_photo_upload` | Pre-existing gap, unrelated to #1088. |
| 3 | `games/:game_slug/factions/:faction_id/photo_upload.json` | `game_faction_photo_upload` | Added alongside the #1088/#1091 backend fix; cache-cleanup entry was never added. Original report target. |
| 4 | `games/:game_slug/possessions/:possession_id/photo_upload.json` | `game_possession_photo_upload` | Same PR as #3 — same gap. |

Confirmed *not* affected (already have a matching `routes` entry clearing the right
`targets`): PC photo, NPC photo, character item photo (PC/NPC), game item photo, game
document photo, game document file photo.

Miniatures (`CollectionPhoto`, `SourcePhoto`, `StlModelPhoto`) are out of scope — that
resource family isn't included in `navi/navi_config.yaml` at all, so it isn't
proxy-cached in the first place.

## Expected Behavior

After a photo is uploaded through any of the 4 affected routes, the cached GET responses
for the owning resource and its listing should be purged immediately — matching the
behavior already correct for PC/NPC photo, character item photo, game item photo, and
game document/file photo uploads. No client should need to wait out the cache TTL to see
a freshly uploaded photo.

## Solution

For each of the 4 missing routes, add a cache-cleanup group following the existing
per-family pattern. The config directory's established invariant is one file per resource
family regardless of size (`sessions.php` is 25 lines, `documents.php` 30 — small files
are already normal there), so:

- **New `factions.php`** — targets `games/:game_slug/factions.json` and
  `games/:game_slug/factions/:faction_id.json`; trigger route
  `games/:game_slug/factions/:faction_id/photo_upload.json` (plus the existing
  detail-mutation route, per the established pattern).
- **New `possessions.php`** — targets `games/:game_slug/possessions.json`,
  `games/:game_slug/possessions/all.json`,
  `games/:game_slug/possessions/:possession_id.json`,
  `games/:game_slug/possessions/:possession_id/full.json`; trigger route
  `games/:game_slug/possessions/:possession_id/photo_upload.json`.
- **New `games.php`** — no cleanup group exists for the `Game` entity itself today
  (nothing needed one before); targets `games.json`, `my-games.json`, and the game
  detail route (`GameListSerializer`, used by both list endpoints, embeds `photo_path`);
  trigger route `games/:game_slug/photo_upload.json` only — scoped strictly to the photo
  upload, see the note below about game detail edits.
- **Extend existing `treasures.php`** — same family already covered there for
  `treasures.json`/`treasures/:treasure_id.json`; just missing the photo-upload trigger
  route on the existing group, so append it there rather than creating a new file.

Register the new/updated groups in `cache_cleanup_map.php` the same way the existing
families are merged in.

**Scope**: in scope is adding proxy cache-cleanup groups for the 4 photo_upload routes
above; out of scope is miniatures/collections (not proxy-cached at all), Navi cache-warmer
config, and backend `Cache-Control`/`X-Skip-Cache` logic (already correct). Also out of
scope, noted here so it isn't silently missed: editing a game's own detail (PATCH
`games/:game_slug.json`, e.g. renaming it) also isn't cache-cleaned today — a related but
separate pre-existing gap in the same `games.php`-to-be family, deliberately not folded
into this issue since it's about detail edits, not photo uploads.

**Testing strategy**: existing PHP tests for `CacheCleanupMiddleware`/
`CacheCleanupMapBuilder` (see `proxy/extension/tests/`) follow a
per-route-triggers-targets-cleared pattern; add cases for each of the 4 new trigger routes
verifying the right targets get purged, mirroring how `items.php`'s photo-upload routes
are already tested.

## Benefits

- Uploaded photos (faction, game possession, treasure, and a game's own cover) become
  visible immediately instead of only after the cache TTL expires.
- Brings these 4 entities' photo-upload behavior in line with the already-correct
  PC/NPC/item/document entities.
- Closes the gap left by #1088/#1091, which fixed the backend logic but not the proxy
  cache invalidation for the same two entities.

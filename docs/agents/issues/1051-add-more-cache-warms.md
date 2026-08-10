# Issue: Add more cache warms

## Description
We had previously held off caching some `/games/....json` endpoints because the cache warmer was struggling to keep up. Now that the warmer runs as its own service with cache files split, we can revisit adding those endpoints back.

A survey of every GET route under `games/urls/` against `navi/resources/*.yml` (`games.yml`, `pcs.yml`, `npcs.yml`, `treasures.yml`) found one public, read-only endpoint that isn't warmed at all today: `/games/{slug}/photos.json` (`game_photos` view, `AllowAny`).

Everything else considered during discussion is intentionally out of scope for this issue:
- Every `/all.json` and `/full.json` variant (e.g. `treasures/all.json`, `documents/all.json`, `items/all.json`, `npcs/all.json`, `npcs/full.json`, `documents/{id}/full.json`, `items/{id}/full.json`, and the pc/npc equivalents) stays uncached.
- Game-level documents (`documents.json` -> detail -> `files.json`/`photos.json`, full and short/paginated) and PC/NPC document lists (`pc_documents`/`npc_documents`) are already fully warmed - no action needed.
- `treasures/missing.json`, `tasks.json`, `polls.json`/`polls/{id}.json`/`polls/{id}/votes.json`, and `sessions/{id}/messages.json` are deferred, not part of this issue.
- `access.json` variants and the treasure/item/document `/summary.json` + `/summary/all.json` endpoints are permission/user-scoped reads (DM-only, restricted per `games/views/game/_treasure_summary.py`) and should never be cache-warmed.

## Problem
`/games/{slug}/photos.json` is a public, read-only endpoint - no auth required, same visibility tier as the other already-warmed game-scoped resources - but the cache warmer never hits it, so every request falls through to the origin instead of being served from cache.

## Expected Behavior
The cache warmer should include `/games/{slug}/photos.json` for every game, following the same pagination pattern already used for sibling resources like `game_items` and `game_treasures`.

## Solution
`game_photos.json` (`games/views/games/game_photos.py`) is a plain `paginated_list_response` with no per-photo detail route and no "short" preview variant - the frontend's `GamePhotosController` fetches the full paginated list directly, unlike the game-detail page's `short_game_pcs`/`short_game_npcs`.

Add it to `navi/resources/games.yml` mirroring the existing `game_items`/`game_treasures` pattern:
- A new `game_photos` action under `paginated_games`'s action list (alongside `game_pcs`, `game_npcs`, `game_treasures`, `game_items`, `game_documents`, `game_sessions`), passing `slug: parsedBody.game_slug`.
- A new `game_photos` resource: `/games/{:slug}/photos.json`, with a `paginated_actions` entry fanning out to a `paginated_game_photos` sub-resource (`/games/{:slug}/photos.json?page={:page}&per_page={:per_page}`) via `headers['pages']`/`headers['per_page']`, same shape as `game_items`/`paginated_game_items`.
- No detail resource, no short/preview variant.

## Benefits
Game photo listings get served from cache instead of hitting the origin on every request, consistent with the other game-scoped resources already warmed.

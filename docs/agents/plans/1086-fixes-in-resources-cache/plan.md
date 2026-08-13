# Plan: Fixes in resources cache

Issue: [1086-fixes-in-resources-cache.md](../../issues/1086-fixes-in-resources-cache.md)

## Overview

Split `navi/resources/games.yml` — currently holding the warm-up chain for
games plus the per-game listings for PCs, NPCs, treasures, items, factions,
possessions, documents, and sessions — into one file per entity type, moving
existing chains into `pcs.yml`/`npcs.yml`/`treasures.yml` and creating new
`items.yml`, `factions.yml`, `possessions.yml`, `documents.yml`,
`sessions.yml` files. This is a pure reorganization: no URL, pagination
shape, or warmed-endpoint set changes. Two agents are involved because a
deployment script outside `navi/` hardcodes the list of resource files pushed
to the Navi server.

## Agents involved

- [cache](cache.md)
- [infra](infra.md)

## Shared contracts

The exact set of `navi/resources/*.yml` filenames after the split is the
contract between these two agents — `cache` creates/renames the files and
updates `navi_config.yaml`'s `include:` list; `infra` must push the same set
via `scripts/warm_navi_cache.sh`'s `RESOURCE_FILES` array (a plain glob isn't
used there, unlike `.claude/scripts/check_cache.sh`, which already discovers
files via `navi/resources/*.yml` and needs no change).

Final file list (unchanged: `permissions.yml`, `clients.yml`):

- `games.yml` — `games`, `paginated_games`, `game_detail`, `game_photos`,
  `paginated_game_photos`
- `pcs.yml` — existing `pc`/`pc_*` chain **plus** `game_pcs`,
  `paginated_game_pcs`, `short_game_pcs` (moved from `games.yml`)
- `npcs.yml` — existing `npc`/`npc_*` chain **plus** `game_npcs`,
  `paginated_game_npcs`, `short_game_npcs` (moved from `games.yml`)
- `treasures.yml` — existing top-level `treasures`/`paginated_treasures`/
  `treasure_detail` chain **plus** `game_treasures`,
  `paginated_game_treasures`, `game_treasure_detail` (moved from
  `games.yml`)
- `items.yml` (new) — `game_items`, `paginated_game_items`,
  `game_item_detail`
- `factions.yml` (new) — `game_factions`, `paginated_game_factions`,
  `game_faction_detail`
- `possessions.yml` (new) — `game_possessions`, `paginated_game_possessions`,
  `game_possession_detail`
- `documents.yml` (new) — `game_documents`, `paginated_game_documents`,
  `game_document_details`, `game_document_files`, `game_document_photos`,
  `short_game_document_files`, `short_game_document_photos`
- `sessions.yml` (new) — `game_sessions`, `paginated_game_sessions_past`,
  `paginated_game_sessions_future`, `paginated_game_sessions_unscheduled`,
  `session`

Each new/receiving file keeps (or gains) the `namespace: $NAVI_NAMEPACE` top
key. No resource is renamed and no `actions`/`paginated_actions` reference
needs an explicit `namespace:` key, since every file shares that one
namespace (per `docs/agents/external/navi/splitting-configuration.md`).

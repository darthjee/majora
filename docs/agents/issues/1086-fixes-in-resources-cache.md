# Issue: Fixes in resources cache

## Description
Split `navi/resources/games.yml` — Majora's Navi cache-warmer configuration — into several smaller, entity-scoped files under `navi/resources/`, so each entity's warm-up chain lives in a file dedicated to it instead of being folded into the general games chain.

## Problem
`navi/resources/games.yml` currently holds the warm-up chain for `games`/`game_photos` *and* the per-game listings for PCs, NPCs, treasures, items, factions, possessions, documents, and sessions, even though dedicated files already exist for some of these entities at the detail level (`pcs.yml`, `npcs.yml`, `treasures.yml`). This makes `games.yml` large and mixes concerns for entities that are otherwise organized in their own files, and leaves no dedicated file at all for items, factions, possessions, documents, or sessions.

## Expected Behavior
This is a pure reorganization: the set of URLs Navi warms, and the shape of the resource chain, are unchanged. `docker-compose up majora_navi` locally and the CI `warm-up-cache` job continue to work exactly as before, just reading the split files via `navi_config.yaml`'s updated `include:` list.

## Solution
Split `navi/resources/games.yml` as follows:

- `games` and `game_photos` (plus `paginated_games`, `game_detail`, `paginated_game_photos`, and the top of the chain that fans out into the other resource files) stay in `navi/resources/games.yml`.
- PCs routes (`game_pcs`, `paginated_game_pcs`, and `short_game_pcs`) move to `navi/resources/pcs.yml`.
- NPCs routes (`game_npcs`, `paginated_game_npcs`, and `short_game_npcs`) move to `navi/resources/npcs.yml`.
- `game_treasures` (and its `paginated_game_treasures`/`game_treasure_detail` chain) moves to `navi/resources/treasures.yml`.
- `game_items` (and its chain) moves to a new `navi/resources/items.yml`.
- `game_factions` (and its chain) moves to a new `navi/resources/factions.yml`.
- `game_possessions` (and its chain) moves to a new `navi/resources/possessions.yml`.
- `game_documents` (and `game_document_details`, `game_document_photos`, `game_document_files`, `short_game_document_photos`, `short_game_document_files`) moves to a new `navi/resources/documents.yml`.
- `game_sessions` (and its `paginated_game_sessions_*`/`session` chain) moves to a new `navi/resources/sessions.yml`.

### Scope boundaries

- **PCs/NPCs — full listings included, not just short previews.** `game_pcs`/`paginated_game_pcs` and `game_npcs`/`paginated_game_npcs` move in full (not just the `short_*` previews), making `pcs.yml`/`npcs.yml` the single owner of everything PC/NPC-related — the per-game listing and the per-PC/NPC detail chain — mirroring how `game_treasures` moves fully into `treasures.yml` rather than leaving the listing behind in `games.yml`.
- **`navi_config.yaml`'s `include:` list must be updated** to add the 5 new files (`items.yml`, `factions.yml`, `possessions.yml`, `documents.yml`, `sessions.yml`) alongside the existing entries — a new `resources/*.yml` file that isn't listed there is silently never loaded by Navi.
- **`docs/agents/cache-warmer.md` must be updated** to describe the new file layout (it currently documents `games.yml` as holding PCs, NPCs, treasures, items, factions, possessions, photos, documents, and sessions all in one file).
- Each new resource file must declare `namespace: $NAVI_NAMEPACE` at the top, matching the convention already used by the existing files (see `docs/agents/external/navi/splitting-configuration.md`). Cross-file `actions`/`paginated_actions` references (e.g. `game_detail` in `games.yml` pointing at resources now living in `pcs.yml`/`npcs.yml`) need no explicit `namespace` key since every file shares the same `$NAVI_NAMEPACE` namespace.

## Benefits
- Each entity's warm-up configuration lives in one place, alongside its existing detail-level resources (e.g. all PC-related warming in `pcs.yml`).
- Smaller, more focused files are easier to review and maintain than one large `games.yml`.
- Matches the project's existing convention of one file per entity type, already followed by `pcs.yml`, `npcs.yml`, and `treasures.yml`.

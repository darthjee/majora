# Issue: Split navi config

## Description
Navi now supports splitting configuration across multiple files via `include` and `namespace` (see `docs/agents/external/navi/splitting-config.md`). Today all resources and clients live in a single monolithic file, `.circleci/navi_config.yaml` (579 lines, ~60 resources).

## Problem
A single huge config file is unwieldy to navigate and maintain — finding or editing a given resource requires scrolling through the whole file, and unrelated changes end up in the same diff.

## Solution
- Move the config out of `.circleci/` into a new top-level `navi/` directory, sibling to `.circleci/`. The entry file becomes `navi/navi_config.yaml`.
  - Update `docker-compose.yml`'s `majora_navi` service: change the volume mount from `.circleci/:/home/node/app` to `./navi/:/home/node/app` (the `command: navi-hey --config navi_config.yaml` stays as-is, since it's already relative to the mounted directory).
  - Update `.circleci/config.yml`'s `warm-up-cache` job: change `navi-hey --config .circleci/navi_config.yaml` to `navi-hey --config navi/navi_config.yaml`.
- Break the `resources` section out of the entry file into multiple files under `navi/resources/`, one per domain entity, matching the natural groupings already present in the current config:
  - `treasures.yml` (treasures, paginated_treasures, treasure_detail)
  - `games.yml` (games, paginated_games, game_detail, short_game_pcs, short_game_npcs, game_pcs, paginated_game_pcs, game_npcs, paginated_game_npcs, game_treasures, paginated_game_treasures, game_items, paginated_game_items, game_item_detail, game_documents, paginated_game_documents, game_document_details, game_document_files, game_document_photos, short_game_document_files, short_game_document_photos, game_sessions, paginated_game_sessions_past, paginated_game_sessions_future, paginated_game_sessions_unscheduled, session)
  - `pcs.yml` (pc, pc_photos, paginated_pc_photos, short_pc_photos, pc_treasures, paginated_pc_treasures, short_pc_treasures, pc_items, paginated_pc_items, pc_item_detail, short_pc_items, pc_documents, paginated_pc_documents, short_pc_documents)
  - `npcs.yml` (npc, npc_photos, paginated_npc_photos, short_npc_photos, npc_treasures, paginated_npc_treasures, short_npc_treasures, npc_items, paginated_npc_items, npc_item_detail, short_npc_items, npc_documents, paginated_npc_documents, short_npc_documents)
  - `permissions.yml` (permissions_game, permissions_treasure, permissions_game_treasure, permissions_game_pc, permissions_game_npc)
  - Each split file is pulled in via a top-level `include:` list in `navi/navi_config.yaml` (e.g. `include: [resources/treasures.yml, resources/games.yml, ...]`).
- None of the split files declare a `namespace:` — every resource stays in the implicit `default` namespace, so existing cross-resource references (e.g. `games.yml`'s actions pointing at resources defined in `pcs.yml`/`npcs.yml`) need no `namespace` key and keep working unchanged.
- `web`, `workers`, `failure`, and `clients` stay in `navi/navi_config.yaml` (the entry file) — only the entry file is consulted for `web`/`workers`/`failure`, and there's currently only one client so it isn't worth splitting out.
- No functional/behavioral change to the warmed-up endpoints — this is a pure file-organization refactor.

## Benefits
- Easier to navigate and maintain — each domain's resources live in their own file.
- Smaller, more focused diffs when only one resource group changes.
- Matches Navi's supported configuration-splitting feature.

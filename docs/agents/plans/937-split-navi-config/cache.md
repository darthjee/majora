# Cache Plan: Split navi config

Main plan: [plan.md](plan.md)

## Shared contracts

- Must create the new entry file at exactly **`navi/navi_config.yaml`** (top-level, sibling to `.circleci/`) — `infra` repoints `docker-compose.yml`/`.circleci/config.yml` at this path.
- Must create **`navi/resources/`** with `treasures.yml`, `games.yml`, `pcs.yml`, `npcs.yml`, `permissions.yml`, included from the entry file via a top-level `include:` list.
- No `namespace:` key in any split file — everything stays in the default namespace.

## Implementation Steps

### Step 1 — Create the `navi/` directory and move the entry file
Move `.circleci/navi_config.yaml` to `navi/navi_config.yaml` (`git mv`). Keep `web`, `workers`, `failure`, and `clients` sections as-is in this file — only the entry file is consulted for those.

### Step 2 — Extract resources into `navi/resources/`
Create `navi/resources/` and split the current `resources:` block into five files, grouped by domain entity (matching the natural groupings already present):

- `treasures.yml` — `treasures`, `paginated_treasures`, `treasure_detail`
- `games.yml` — `games`, `paginated_games`, `game_detail`, `short_game_pcs`, `short_game_npcs`, `game_pcs`, `paginated_game_pcs`, `game_npcs`, `paginated_game_npcs`, `game_treasures`, `paginated_game_treasures`, `game_items`, `paginated_game_items`, `game_item_detail`, `game_documents`, `paginated_game_documents`, `game_document_details`, `game_document_files`, `game_document_photos`, `short_game_document_files`, `short_game_document_photos`, `game_sessions`, `paginated_game_sessions_past`, `paginated_game_sessions_future`, `paginated_game_sessions_unscheduled`, `session`
- `pcs.yml` — `pc`, `pc_photos`, `paginated_pc_photos`, `short_pc_photos`, `pc_treasures`, `paginated_pc_treasures`, `short_pc_treasures`, `pc_items`, `paginated_pc_items`, `pc_item_detail`, `short_pc_items`, `pc_documents`, `paginated_pc_documents`, `short_pc_documents`
- `npcs.yml` — `npc`, `npc_photos`, `paginated_npc_photos`, `short_npc_photos`, `npc_treasures`, `paginated_npc_treasures`, `short_npc_treasures`, `npc_items`, `paginated_npc_items`, `npc_item_detail`, `short_npc_items`, `npc_documents`, `paginated_npc_documents`, `short_npc_documents`
- `permissions.yml` — `permissions_game`, `permissions_treasure`, `permissions_game_treasure`, `permissions_game_pc`, `permissions_game_npc`

None of these files declare a `namespace:` key. Cross-file references (e.g. a `games.yml` action pointing at a `pc`/`npc` resource) need no `namespace` key since everything resolves in the default namespace.

### Step 3 — Wire up `include` in the entry file
In `navi/navi_config.yaml`, remove the inline `resources:` block (now empty/removed) and add:

```yaml
include:
  - resources/treasures.yml
  - resources/games.yml
  - resources/pcs.yml
  - resources/npcs.yml
  - resources/permissions.yml
```

### Step 4 — Verify no drift
Diff the concatenation of the new files against the original `resources:` block to confirm every resource, action, and pagination config was carried over unchanged (this is a pure reorganization — no field should change value).

## Files to Change
- `navi/navi_config.yaml` — new entry file (moved from `.circleci/navi_config.yaml`), keeps `web`/`workers`/`failure`/`clients`, adds `include:` list, drops inline `resources:`.
- `navi/resources/treasures.yml` — new file.
- `navi/resources/games.yml` — new file.
- `navi/resources/pcs.yml` — new file.
- `navi/resources/npcs.yml` — new file.
- `navi/resources/permissions.yml` — new file.
- `.circleci/navi_config.yaml` — deleted (moved).

## Notes
- This is a config-only change; no code in `backend/`/`frontend/`/`proxy/` is affected.
- Coordinate with `infra` (see [infra.md](infra.md)) — they depend on the entry file existing at `navi/navi_config.yaml` before their docker-compose/CircleCI changes are meaningful, though both sets of changes can land in the same PR.

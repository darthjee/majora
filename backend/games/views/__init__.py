"""Views package for the games app.

This package holds no re-exports: every view function is a plain `@api_view`-decorated
callable defined in — and imported directly from — its owning submodule (e.g. `from
games.views.games import game_detail`, `from games.views.game import game_pc_full`). This
keeps `import games.views` cheap: only the submodules actually needed by a given `urls.py`
module get imported, instead of every view function in the app loading eagerly.

Subpackage map (mirrors `docs/agents/views-organization.md`):

- `games/` — views for the `Game` resource's own actions and its nested sub-resources not
  yet migrated into `game/` (documents, factions, items, possessions, common items,
  treasures, photos).
- `game/` — views for resources nested under a single game: `pcs/`, `npcs/` (each with a
  `detail/` subfolder for member actions and per-nested-resource sub-subfolders —
  documents, factions, items, possessions, treasures, photos), `players/`,
  `conversations/`, plus shared per-resource helpers (`photos/`, `possessions/`,
  `treasures/`, `documents/`, `factions/`, `items/`) reused by both `pcs/` and `npcs/`.
- `game_sessions/` — views for a game's sessions (create/list/detail, session polls,
  session messages).
- `game_tasks/` — views for a game's tasks (list/detail).
- `permissions/` — the entity-agnostic `/permissions/*.json` endpoints (one file per
  entity type).
- `polls/` — views for a game's polls (list/detail, votes, close).
- `treasures/` — views for the top-level (not game-scoped) `Treasure` resource.
- Root-level cross-cutting files: `common.py` (helpers shared across view modules,
  imported directly as `games.views.common`), `photo_upload.py`, `ready.py` and
  `access_route_config.py` (single-view infra endpoints).
"""

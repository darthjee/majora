# Issue: Split 'possessions' sub-resource views into detail/ (PC/NPC)

## Problem

Per the [Views Organization Convention](docs/agents/views-organization.md), member actions on
a single item live in a `detail/` subfolder inside that resource's own folder.
`backend/games/views/game/{npcs,pcs}/detail/possessions/` currently mixes the NPC/PC's own
possession-collection actions with member actions on a single possession, flat in the same
folder:

- **Collection actions (stay in `possessions/`)**: `game_npc_possessions.py`,
  `game_npc_possessions_all.py`, `game_npc_possessions_available.py`,
  `game_npc_possessions_available_all.py`
- **Member actions on one possession (→ `possessions/detail/`, new folder)**:
  `game_npc_possession_detail.py`, `game_npc_possession_detail_full.py`,
  `game_npc_possession_acquire.py`, `game_npc_possession_acquire_all.py`,
  `game_npc_possession_remove.py`, `game_npc_possession_remove_all.py`

Same 10 files (+ `__init__.py`) mirrored under the `pcs/` tree with `game_pc_*` filenames.

This is purely structural — no logic changes. Every one of the 6 member-action files is a
1-line factory wrapper around `backend/games/views/game/_possession_shared.py`; moving them
only requires updating each moved file's relative import depth (currently `from
...._possession_shared import ...`, 4 dots up to `game/`; after the move, one level deeper,
so 5 dots) plus the two package re-export files.

## Solution

For both `backend/games/views/game/npcs/detail/possessions/` and
`backend/games/views/game/pcs/detail/possessions/` (mirror, `game_pc_*` prefix):

1. Move the 6 member-action view files into a new `possessions/detail/` subfolder, filenames
   unchanged; the 4 collection files stay in `possessions/`.
2. Move each moved file's mirrored test file alongside it, under
   `backend/games/tests/views/game/{npcs,pcs}/detail/possessions/detail/` (same filename,
   `_test.py` suffix).
3. Bump the relative import in each moved file from `from ...._possession_shared import ...`
   (4 dots) to `from ....._possession_shared import ...` (5 dots), to account for the extra
   `detail/` nesting level.
4. Add `possessions/detail/__init__.py`, following the sibling `npcs/detail/__init__.py` /
   `pcs/detail/__init__.py` pattern — a docstring-only module (e.g. `"""Member-action views
   for a single NPC's possession."""`), not a re-export file.
5. Update, in each of the two package re-export files:
   - `backend/games/views/game/npcs/__init__.py`
   - `backend/games/views/game/pcs/__init__.py`

   the 6 moved symbols' import lines from `from .detail.possessions.<module> import <name>`
   to `from .detail.possessions.detail.<module> import <name>`. The 4 collection symbols'
   import lines are unchanged.
6. No URLconf changes needed — `urls.py` imports from the `npcs`/`pcs` package's
   `__init__.py`, which keeps exporting the same names.

### Target structure

```
possessions/
├── __init__.py
├── game_npc_possessions.py                       # collection (stays)
├── game_npc_possessions_all.py
├── game_npc_possessions_available.py
├── game_npc_possessions_available_all.py
└── detail/                                        # NEW — member actions
    ├── __init__.py
    ├── game_npc_possession_detail.py
    ├── game_npc_possession_detail_full.py
    ├── game_npc_possession_acquire.py
    ├── game_npc_possession_acquire_all.py
    ├── game_npc_possession_remove.py
    └── game_npc_possession_remove_all.py
```

Same shape for the `pcs/` tree with `game_pc_*` filenames, and for
`backend/games/tests/views/game/{npcs,pcs}/detail/possessions/`.

### Decisions

1. Purely structural move — no behavior changes, no renames.
2. `_all`/`_full`/`_available` variants stay separate files (different serializers/permissions).
3. `possessions/detail/__init__.py` is a docstring-only module, matching the sibling
   `detail/__init__.py` pattern already used one level up (not a re-export file).

### Acceptance Criteria

- [ ] All 6 member-action view files (×2 trees) moved into `possessions/detail/`, filenames
      unchanged; the 4 collection files stay put.
- [ ] All mirrored test files moved alongside their view counterparts.
- [ ] Relative imports in every moved file updated to the correct depth (5 dots).
- [ ] `npcs/__init__.py` and `pcs/__init__.py` re-export paths updated to match.
- [ ] Full backend test suite passes.
- [ ] No behavior change.

### Context

Sub-issue of #1223 ("Refatoração: listar arquivos de views de 'characters' (PC/NPC) para
divisão"). Independent of the other sub-issues split from #1223 (#1227–#1229, #1231–#1233).

## Benefits

- Makes the file responsible for the `possessions/:id/*` routes predictable from its path
  alone, per the documented [Views Organization Convention](docs/agents/views-organization.md).
- Keeps the `possessions/` folder's own list/collection actions cleanly separated from
  member actions on a single possession, matching the pattern already used one level up
  (`npcs/detail/`, `pcs/detail/`).

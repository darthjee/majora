# Issue: Split 'factions' sub-resource views into detail/ (PC/NPC)

## Problem

Per the [Views Organization Convention](docs/agents/views-organization.md), member actions on a single item live in a `detail/` subfolder inside that resource's own folder. `backend/games/views/game/{npcs,pcs}/detail/factions/` currently mixes the NPC/PC's own faction-collection actions with member actions on a single faction membership, flat in the same folder.

Purely structural — no logic changes. Every file here is a 1-line factory wrapper around `_faction_shared.py` (e.g. `game_npc_faction_detail = build_faction_detail_view(npc=True)`); moves only require updating each moved file's relative import depth plus the two package re-export files.

Sub-issue of #1223 (parent: "Refatoração: listar arquivos de views de 'characters' (PC/NPC) para divisão"). Independent of the other sub-issues split from #1223.

## Solution

### Affected Files

`backend/games/views/game/npcs/detail/factions/` and `backend/games/views/game/pcs/detail/factions/` (mirror, `game_pc_*` prefix), 13 files each (12 view files + `__init__.py`):

- **Collection (stays in `factions/`)**: `game_npc_factions.py`, `game_npc_factions_all.py`, `game_npc_factions_available.py`, `game_npc_factions_available_all.py`
- **Member actions on one faction membership (→ `factions/detail/`, new folder)**: `game_npc_faction_detail.py`, `game_npc_faction_detail_full.py`, `game_npc_faction_acquire.py`, `game_npc_faction_acquire_all.py`, `game_npc_faction_remove.py`, `game_npc_faction_remove_all.py`, `game_npc_faction_summary.py`, `game_npc_faction_summary_all.py`

No nested sub-resources in `factions/` — only the `detail/` split applies here.

Their mirrored test files under `backend/games/tests/views/game/{npcs,pcs}/detail/factions/` must move alongside (same filename, `_test.py` suffix).

Also update, in each of the two `__init__.py` re-export files:
- `backend/games/views/game/npcs/__init__.py`
- `backend/games/views/game/pcs/__init__.py`

to point each moved symbol's `from .detail.factions.<module> import <name>` line at `.detail.factions.detail.<module>`.

### Decisions

1. Purely structural move — no behavior changes, no renames.
2. Each moved file's relative import to `_faction_shared.py` gains one `..` level (from 4 levels up to 5, e.g. `from ...._faction_shared import ...` to `from ....._faction_shared import ...`).
3. `_all`/`_full`/`_available` variants stay separate files (different serializers/permissions).
4. Add an `__init__.py` to `factions/detail/`, docstring-only — confirmed by checking the sibling pattern: `npcs/detail/__init__.py` is a one-line docstring (`Member-action views for a single NPC (full, access, permissions, photo upload).`), not a re-export. `factions/detail/__init__.py` should follow the same style, e.g. a docstring like `Member-action views for a single NPC's faction (detail, acquire, remove, summary).` (mirrored for PC). Same resolution already applied to the sibling `items` split (#1229).
5. No URLconf changes needed — `urls.py` imports from the `npcs`/`pcs` package's `__init__.py`.

### Target Structure

```
factions/
├── game_npc_factions.py                          # collection (stays)
├── game_npc_factions_all.py
├── game_npc_factions_available.py
├── game_npc_factions_available_all.py
└── detail/                                        # NEW — member actions
    ├── __init__.py
    ├── game_npc_faction_detail.py
    ├── game_npc_faction_detail_full.py
    ├── game_npc_faction_acquire.py
    ├── game_npc_faction_acquire_all.py
    ├── game_npc_faction_remove.py
    ├── game_npc_faction_remove_all.py
    ├── game_npc_faction_summary.py
    └── game_npc_faction_summary_all.py
```

Same shape for the `pcs/` tree with `game_pc_*` filenames, and for `backend/games/tests/views/game/{npcs,pcs}/detail/factions/`.

### Acceptance Criteria

- [ ] All 8 member-action view files (×2 trees) moved into `factions/detail/`, filenames unchanged; the 4 collection files stay put.
- [ ] All mirrored test files moved alongside their view counterparts.
- [ ] Relative imports in every moved file updated to the correct depth.
- [ ] `npcs/__init__.py` and `pcs/__init__.py` re-export paths updated to match.
- [ ] `factions/detail/__init__.py` added, docstring-only (matching the sibling `detail/` pattern).
- [ ] Full backend test suite passes.
- [ ] No behavior change.

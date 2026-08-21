# Issue: Split 'treasures' sub-resource views into detail/ (PC/NPC)

## Problem

Per the [Views Organization Convention](docs/agents/views-organization.md), member actions on a single item live in a `detail/` subfolder inside that resource's own folder. `backend/games/views/game/{npcs,pcs}/detail/treasures/` currently mixes the NPC/PC's own treasure-collection actions with member actions on a single treasure, flat in the same folder.

Purely structural — no logic changes. Every file here is a 1-line factory wrapper around `_treasure_shared.py` (and `_treasure_finder.py`); moves only require updating each moved file's relative import depth plus the two package re-export files.

Sub-issue of #1223 (parent: "Refatoração: listar arquivos de views de 'characters' (PC/NPC) para divisão"). Independent of the other sub-issues split from #1223.

## Solution

### Affected Files

`backend/games/views/game/npcs/detail/treasures/` (11 files: 10 view + `__init__.py`) and `backend/games/views/game/pcs/detail/treasures/` (10 files: 9 view + `__init__.py` — the PC tree has no `game_pc_treasures_all.py`; only NPC has an `_all` variant of the collection listing):

- **Collection (stays in `treasures/`)**: `game_npc_treasures.py`, `game_npc_treasures_all.py` (NPC only)
- **Member actions on one treasure (→ `treasures/detail/`, new folder)**: `game_npc_treasure_acquire.py`, `game_npc_treasure_acquire_all.py`, `game_npc_treasure_buy.py`, `game_npc_treasure_buy_all.py`, `game_npc_treasure_remove.py`, `game_npc_treasure_sell.py`, `game_npc_treasure_summary.py`, `game_npc_treasure_summary_all.py`

Their mirrored test files under `backend/games/tests/views/game/{npcs,pcs}/detail/treasures/` must move alongside (same filename, `_test.py` suffix).

Also update, in each of the two `__init__.py` re-export files:
- `backend/games/views/game/npcs/__init__.py`
- `backend/games/views/game/pcs/__init__.py`

to point each moved symbol's `from .detail.treasures.<module> import <name>` line at `.detail.treasures.detail.<module>`.

### Decisions

1. Purely structural move — no behavior changes, no renames.
2. Each moved file's relative import gains one `..` level (from 4 levels up to 5).
3. `_all`/`_full`/`_available` variants stay separate files (different serializers/permissions).
4. Add an `__init__.py` to `treasures/detail/`, docstring-only — confirmed by checking the sibling pattern: `npcs/detail/__init__.py` is `"""Member-action views for a single NPC (full, access, permissions, photo upload)."""`, not a re-export (same convention already resolved for the sibling `items/detail/` split in #1229). `treasures/detail/__init__.py` should follow the same style, e.g. `"""Member-action views for a single NPC's treasure (acquire, buy, remove, sell, summary)."""` (mirrored for PC).
5. No URLconf changes needed — `urls.py` imports from the `npcs`/`pcs` package's `__init__.py`.

### Target Structure

```
treasures/
├── game_npc_treasures.py                         # collection (stays)
├── game_npc_treasures_all.py                     # NPC only, no PC equivalent
└── detail/                                        # NEW — member actions
    ├── __init__.py
    ├── game_npc_treasure_acquire.py
    ├── game_npc_treasure_acquire_all.py
    ├── game_npc_treasure_buy.py
    ├── game_npc_treasure_buy_all.py
    ├── game_npc_treasure_remove.py
    ├── game_npc_treasure_sell.py
    ├── game_npc_treasure_summary.py
    └── game_npc_treasure_summary_all.py
```

Same shape for the `pcs/` tree with `game_pc_*` filenames (minus `game_pc_treasures_all.py`, which doesn't exist), and for `backend/games/tests/views/game/{npcs,pcs}/detail/treasures/`.

### Acceptance Criteria

- [ ] All 8 NPC / 8 PC member-action view files moved into `treasures/detail/`, filenames unchanged; the collection file(s) stay put.
- [ ] All mirrored test files moved alongside their view counterparts.
- [ ] Relative imports in every moved file updated to the correct depth.
- [ ] `npcs/__init__.py` and `pcs/__init__.py` re-export paths updated to match.
- [ ] `treasures/detail/__init__.py` added, docstring-only (matching the sibling `detail/` pattern).
- [ ] Full backend test suite passes.
- [ ] No behavior change.

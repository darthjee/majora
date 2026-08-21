# Issue: Split 'items' sub-resource views into detail/ (PC/NPC)

## Problem

Per the [Views Organization Convention](docs/agents/views-organization.md), member actions on a single item live in a `detail/` subfolder inside that resource's own folder. `backend/games/views/game/{npcs,pcs}/detail/items/` currently mixes the NPC/PC's own item-collection actions with member actions on a single item, flat in the same folder.

Purely structural — no logic changes. Every file here is a 1-line factory wrapper around `_item_shared.py`; moves only require updating each moved file's relative import depth plus the two package re-export files.

Sub-issue of #1223 (parent: "Refatoração: listar arquivos de views de 'characters' (PC/NPC) para divisão"). Independent of the other sub-issues split from #1223.

## Solution

### Affected Files

`backend/games/views/game/npcs/detail/items/` and `backend/games/views/game/pcs/detail/items/` (mirror, `game_pc_*` prefix), 14 files each (13 view files + `__init__.py`):

- **Collection (stays in `items/`)**: `game_npc_items.py`, `game_npc_items_all.py`, `game_npc_items_available.py`, `game_npc_items_available_all.py`
- **Member actions on one item (→ `items/detail/`, new folder)**: `game_npc_item_detail.py`, `game_npc_item_detail_full.py`, `game_npc_item_acquire.py`, `game_npc_item_acquire_all.py`, `game_npc_item_remove.py`, `game_npc_item_remove_all.py`, `game_npc_item_summary.py`, `game_npc_item_summary_all.py`, `game_npc_item_photo_upload.py`

`game_npc_item_photo_upload.py` (route `items/:id/photo_upload`) is a member action on a single item, not a nested `photos` sub-resource — it goes to `items/detail/`, not a new `items/photos/`.

Their mirrored test files under `backend/games/tests/views/game/{npcs,pcs}/detail/items/` must move alongside (same filename, `_test.py` suffix).

Also update, in each of the two `__init__.py` re-export files:
- `backend/games/views/game/npcs/__init__.py`
- `backend/games/views/game/pcs/__init__.py`

to point each moved symbol's `from .detail.items.<module> import <name>` line at `.detail.items.detail.<module>`.

### Decisions

1. Purely structural move — no behavior changes, no renames.
2. Each moved file's relative import to `_item_shared.py` gains one `..` level (from 4 levels up to 5).
3. `_all`/`_full`/`_available` variants stay separate files (different serializers/permissions).
4. `item_photo_upload` → `items/detail/` (member action, not a sub-resource) — this was flagged as an open question on the parent issue and resolved during the split discussion.
5. Add an `__init__.py` to `items/detail/`, docstring-only — confirmed by checking the sibling pattern: `npcs/detail/__init__.py` is `"""Member-action views for a single NPC (full, access, permissions, photo upload)."""`, not a re-export. `items/detail/__init__.py` should follow the same style, e.g. `"""Member-action views for a single NPC's item (detail, acquire, remove, summary, photo upload)."""` (mirrored for PC).
6. No URLconf changes needed — `urls.py` imports from the `npcs`/`pcs` package's `__init__.py`.

### Target Structure

```
items/
├── game_npc_items.py                             # collection (stays)
├── game_npc_items_all.py
├── game_npc_items_available.py
├── game_npc_items_available_all.py
└── detail/                                        # NEW — member actions
    ├── __init__.py
    ├── game_npc_item_detail.py
    ├── game_npc_item_detail_full.py
    ├── game_npc_item_acquire.py
    ├── game_npc_item_acquire_all.py
    ├── game_npc_item_remove.py
    ├── game_npc_item_remove_all.py
    ├── game_npc_item_summary.py
    ├── game_npc_item_summary_all.py
    └── game_npc_item_photo_upload.py
```

Same shape for the `pcs/` tree with `game_pc_*` filenames, and for `backend/games/tests/views/game/{npcs,pcs}/detail/items/`.

### Acceptance Criteria

- [ ] All 9 member-action view files (×2 trees) moved into `items/detail/`, filenames unchanged; the 4 collection files stay put.
- [ ] All mirrored test files moved alongside their view counterparts.
- [ ] Relative imports in every moved file updated to the correct depth.
- [ ] `npcs/__init__.py` and `pcs/__init__.py` re-export paths updated to match.
- [ ] `items/detail/__init__.py` added, docstring-only (matching the sibling `detail/` pattern).
- [ ] Full backend test suite passes.
- [ ] No behavior change.

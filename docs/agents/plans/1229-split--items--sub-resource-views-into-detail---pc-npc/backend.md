# Backend Plan: Split 'items' sub-resource views into detail/ (PC/NPC)

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Split the NPC `items/` tree

Move the 9 member-action view files out of `backend/games/views/game/npcs/detail/items/` into a new `backend/games/views/game/npcs/detail/items/detail/` subfolder (the 4 collection files — `game_npc_items.py`, `game_npc_items_all.py`, `game_npc_items_available.py`, `game_npc_items_available_all.py` — stay where they are). In each moved file, change the relative import of `_item_shared` from `from ...._item_shared import ...` (4 dots) to `from ....._item_shared import ...` (5 dots) — one extra `..` level for the new nesting. Add `backend/games/views/game/npcs/detail/items/detail/__init__.py` as a docstring-only module, matching the sibling pattern in `backend/games/views/game/npcs/detail/__init__.py` (e.g. `"""Member-action views for a single NPC's item (detail, acquire, remove, summary, photo upload)."""`).

Move the mirrored test files (same filenames, `_test.py` suffix) from `backend/games/tests/views/game/npcs/detail/items/` into a new `backend/games/tests/views/game/npcs/detail/items/detail/`. Test files reference views via package imports (`games.views...`), not deep relative imports, so no import-depth changes are expected there — verify while moving and adjust only if a file does something unusual.

Update `backend/games/views/game/npcs/__init__.py`: for each of the 9 moved symbols, change `from .detail.items.<module> import <name>` to `from .detail.items.detail.<module> import <name>`. The 4 collection symbols' import lines are unchanged.

### Step 2 — Split the PC `items/` tree

Same as Step 1, mirrored for PC: move the 9 `game_pc_item_*` member-action files from `backend/games/views/game/pcs/detail/items/` into `backend/games/views/game/pcs/detail/items/detail/` (the 4 `game_pc_items*` collection files stay put), bump their `_item_shared` import to 5 dots, add a docstring-only `backend/games/views/game/pcs/detail/items/detail/__init__.py` mirroring `backend/games/views/game/pcs/detail/__init__.py`'s style, move the mirrored test files into `backend/games/tests/views/game/pcs/detail/items/detail/`, and update the 9 corresponding import lines in `backend/games/views/game/pcs/__init__.py` from `.detail.items.<module>` to `.detail.items.detail.<module>`.

## Files to Change

- `backend/games/views/game/npcs/detail/items/game_npc_item_detail.py`, `game_npc_item_detail_full.py`, `game_npc_item_acquire.py`, `game_npc_item_acquire_all.py`, `game_npc_item_remove.py`, `game_npc_item_remove_all.py`, `game_npc_item_summary.py`, `game_npc_item_summary_all.py`, `game_npc_item_photo_upload.py` — move to `.../items/detail/`, bump `_item_shared` import to 5 dots
- `backend/games/views/game/npcs/detail/items/detail/__init__.py` — new, docstring-only
- `backend/games/tests/views/game/npcs/detail/items/game_npc_item_*_test.py` (9 files) — move to `.../items/detail/`
- `backend/games/views/game/npcs/__init__.py` — update 9 `from .detail.items.<module>` re-export lines to `from .detail.items.detail.<module>`
- `backend/games/views/game/pcs/detail/items/game_pc_item_detail.py`, `game_pc_item_detail_full.py`, `game_pc_item_acquire.py`, `game_pc_item_acquire_all.py`, `game_pc_item_remove.py`, `game_pc_item_remove_all.py`, `game_pc_item_summary.py`, `game_pc_item_summary_all.py`, `game_pc_item_photo_upload.py` — move to `.../items/detail/`, bump `_item_shared` import to 5 dots
- `backend/games/views/game/pcs/detail/items/detail/__init__.py` — new, docstring-only
- `backend/games/tests/views/game/pcs/detail/items/game_pc_item_*_test.py` (9 files) — move to `.../items/detail/`
- `backend/games/views/game/pcs/__init__.py` — update 9 `from .detail.items.<module>` re-export lines to `from .detail.items.detail.<module>`

No changes to `backend/games/urls.py` or any `urls/` file — they import from the `npcs`/`pcs` package's `__init__.py`, whose public symbol names are unchanged.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/` (CI job: `pytest_views_characters`)

## Notes

- Purely structural — no logic, route, or behavior changes; every moved file is a 1-line factory wrapper around `_item_shared.py`.
- The 4 collection files and their tests are unaffected and must not move.

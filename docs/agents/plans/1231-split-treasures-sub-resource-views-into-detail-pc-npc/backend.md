# Backend Plan: Split 'treasures' sub-resource views into detail/ (PC/NPC)

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Move member-action view files (and their tests) into `treasures/detail/`

For both `backend/games/views/game/npcs/detail/treasures/` and `backend/games/views/game/pcs/detail/treasures/`, create a new `detail/` subfolder and `git mv` the 8 member-action view files into it (filenames unchanged). The 2 collection files (`game_npc_treasures.py`, `game_npc_treasures_all.py` — NPC only) stay in place.

Every moved file's package moves one level deeper (`treasures/` → `treasures/detail/`), so **every existing relative import in that file gains exactly one leading dot** — regardless of what it imports or how many import lines it has. Most files import only `build_treasure_*_view` from `_treasure_shared.py` (4 dots → 5 dots), but `game_npc_treasure_summary.py`/`game_npc_treasure_summary_all.py` and their PC equivalents are full view functions (decorators, docstrings, request handling) with multiple imports at different depths — every one of those lines needs the same one-dot shift, not just the shared-factory import:

- `...._treasure_shared` → `....._treasure_shared` (all `_acquire[_all]`, `_buy[_all]`, `_remove`, `_sell` files)
- `......decorators` → `.......decorators` (`_summary[_all]` files)
- `......models` → `.......models` (`_summary[_all]` files)
- `....treasures._treasure_summary` → `.....treasures._treasure_summary` (`_summary[_all]` files)
- `...._shared` → `....._shared` (`game_pc_treasure_summary_all.py` only — `_get_character_or_404`)

Move the mirrored test files the same way, same filenames (`_test.py` suffix), from `backend/games/tests/views/game/{npcs,pcs}/detail/treasures/` into `backend/games/tests/views/game/{npcs,pcs}/detail/treasures/detail/` — test files only import the module under test plus fixtures, so check each one's relative import depth individually rather than assuming the same shift pattern as the view files (test tree depth doesn't necessarily mirror the view tree depth).

No renames, no logic changes — every moved file's behavior stays identical.

## Files to Change

Move (8 view + 8 test files, `npcs/detail/treasures/` → `npcs/detail/treasures/detail/`, filenames unchanged):
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasure_acquire.py`
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasure_acquire_all.py`
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasure_buy.py`
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasure_buy_all.py`
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasure_remove.py`
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasure_sell.py`
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasure_summary.py`
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasure_summary_all.py`
- matching 8 files under `backend/games/tests/views/game/npcs/detail/treasures/*_test.py`

Move (8 view + 8 test files, `pcs/detail/treasures/` → `pcs/detail/treasures/detail/`, filenames unchanged):
- `backend/games/views/game/pcs/detail/treasures/game_pc_treasure_acquire.py`
- `backend/games/views/game/pcs/detail/treasures/game_pc_treasure_acquire_all.py`
- `backend/games/views/game/pcs/detail/treasures/game_pc_treasure_buy.py`
- `backend/games/views/game/pcs/detail/treasures/game_pc_treasure_buy_all.py`
- `backend/games/views/game/pcs/detail/treasures/game_pc_treasure_remove.py`
- `backend/games/views/game/pcs/detail/treasures/game_pc_treasure_sell.py`
- `backend/games/views/game/pcs/detail/treasures/game_pc_treasure_summary.py`
- `backend/games/views/game/pcs/detail/treasures/game_pc_treasure_summary_all.py`
- matching 8 files under `backend/games/tests/views/game/pcs/detail/treasures/*_test.py`

Stay in place (collection files — unaffected):
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasures.py`
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasures_all.py` (NPC only)
- `backend/games/views/game/pcs/detail/treasures/game_pc_treasures.py`
- matching `*_test.py` files for the above

### Step 2 — Add `detail/__init__.py`, update package re-exports, run the suite

Add a docstring-only `__init__.py` to each new folder (matching the sibling `<resource>/detail/__init__.py` convention, e.g. `npcs/detail/__init__.py`'s `"""Member-action views for a single NPC (full, access, permissions, photo upload)."""` — not a re-export):
- `backend/games/views/game/npcs/detail/treasures/detail/__init__.py` — e.g. `"""Member-action views for a single NPC's treasure (acquire, buy, remove, sell, summary)."""`
- `backend/games/views/game/pcs/detail/treasures/detail/__init__.py` — mirrored for PC

Also add an empty `__init__.py` to each new test folder, matching the existing sibling test-tree convention (check `backend/games/tests/views/game/npcs/detail/treasures/__init__.py` for the pattern to mirror):
- `backend/games/tests/views/game/npcs/detail/treasures/detail/__init__.py`
- `backend/games/tests/views/game/pcs/detail/treasures/detail/__init__.py`

Update the two package re-export files, changing each moved symbol's import path from `.detail.treasures.<module>` to `.detail.treasures.detail.<module>` (8 lines each; the 2 NPC collection imports — `game_npc_treasures`, `game_npc_treasures_all` — keep their existing `.detail.treasures.<module>` path unchanged since those files didn't move):
- `backend/games/views/game/npcs/__init__.py`
- `backend/games/views/game/pcs/__init__.py`

Run the full backend test suite (see `## CI Checks`) and confirm it's green with no behavior change.

## Files to Change (Step 2)

- `backend/games/views/game/npcs/detail/treasures/detail/__init__.py` (new)
- `backend/games/views/game/pcs/detail/treasures/detail/__init__.py` (new)
- `backend/games/tests/views/game/npcs/detail/treasures/detail/__init__.py` (new)
- `backend/games/tests/views/game/pcs/detail/treasures/detail/__init__.py` (new)
- `backend/games/views/game/npcs/__init__.py` — update 8 `from .detail.treasures.<module> import <name>` lines to `.detail.treasures.detail.<module>`
- `backend/games/views/game/pcs/__init__.py` — update 8 `from .detail.treasures.<module> import <name>` lines to `.detail.treasures.detail.<module>`

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/` (CI job: `pytest_views_characters`)

## Notes

- The issue text describes every file here as a "1-line factory wrapper around `_treasure_shared.py`" — that holds for `_acquire[_all]`, `_buy[_all]`, `_remove`, `_sell`, but not for `_summary`/`_summary_all`, which are full view functions with several imports at different relative depths (see Step 1). The one-dot-deeper rule still applies uniformly to every import line in every moved file; only the "1-line wrapper" framing doesn't generalize to those two.
- No URLconf changes needed — `urls.py` imports from the `npcs`/`pcs` package `__init__.py`, whose public symbol names are unchanged.
- `_treasure_shared.py` and `_treasure_finder.py` (in `backend/games/views/game/`) and the shared `game/treasures/` package (`_treasure_summary.py`, `_treasures.py`) are untouched — only the import path leading to them changes.

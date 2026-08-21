# Backend Plan: Split 'factions' sub-resource views into detail/ (PC/NPC)

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Split the NPC `factions/` tree

Move the 8 member-action view files out of `backend/games/views/game/npcs/detail/factions/` into a new `backend/games/views/game/npcs/detail/factions/detail/` subfolder (the 4 collection files — `game_npc_factions.py`, `game_npc_factions_all.py`, `game_npc_factions_available.py`, `game_npc_factions_available_all.py` — stay where they are). Unlike the sibling `items` split, these files import from several different modules, not just one shared helper — every relative import in every moved file gains exactly one extra `..` level (the package moves one level deeper), regardless of what it targets:

- `game_npc_faction_detail.py`, `game_npc_faction_acquire.py`, `game_npc_faction_acquire_all.py`, `game_npc_faction_remove.py`, `game_npc_faction_remove_all.py`: `from ...._faction_shared import ...` (4 dots) → `from ....._faction_shared import ...` (5 dots).
- `game_npc_faction_detail_full.py`: `from ......serializers import CharacterFactionAllSerializer` (6 dots) → 7 dots; `from ...._faction_shared import ...` (4 dots) → 5 dots.
- `game_npc_faction_summary.py`: `from ......decorators import regular, skip_cache` (6 dots) → 7 dots; `from ......models import Game` (6 dots) → 7 dots; `from ....factions._faction_summary import character_faction_summary` (4 dots) → 5 dots.
- `game_npc_faction_summary_all.py`: `from ......decorators import restricted` (6 dots) → 7 dots; `from ......models import Game` (6 dots) → 7 dots; `from ....factions._faction_summary import (...)` (4 dots) → 5 dots.

Add `backend/games/views/game/npcs/detail/factions/detail/__init__.py` as a docstring-only module, matching the sibling pattern in `backend/games/views/game/npcs/detail/__init__.py` (e.g. `"""Member-action views for a single NPC's faction (detail, acquire, remove, summary)."""`).

Move the mirrored test files (same filenames, `_test.py` suffix) from `backend/games/tests/views/game/npcs/detail/factions/` into a new `backend/games/tests/views/game/npcs/detail/factions/detail/`. Test files reference views via package imports (`games.views...`, `games.models`, `games.tests...`), not deep relative imports, so no import-depth changes are expected there — verify while moving and adjust only if a file does something unusual.

Update `backend/games/views/game/npcs/__init__.py`: for each of the 8 moved symbols, change `from .detail.factions.<module> import <name>` to `from .detail.factions.detail.<module> import <name>`. The 4 collection symbols' import lines are unchanged.

### Step 2 — Split the PC `factions/` tree

Same as Step 1, mirrored for PC: move the 8 `game_pc_faction_*` member-action files from `backend/games/views/game/pcs/detail/factions/` into `backend/games/views/game/pcs/detail/factions/detail/` (the 4 `game_pc_factions*` collection files stay put), bump every relative import in every moved file by one `..` level:

- `game_pc_faction_detail.py`, `game_pc_faction_acquire.py`, `game_pc_faction_acquire_all.py`, `game_pc_faction_remove.py`, `game_pc_faction_remove_all.py`: `from ...._faction_shared import ...` (4 dots) → 5 dots.
- `game_pc_faction_detail_full.py`: `from ......serializers import CharacterFactionAllSerializer` (6 dots) → 7 dots; `from ...._faction_shared import ...` (4 dots) → 5 dots.
- `game_pc_faction_summary.py`: `from ......decorators import regular, skip_cache` (6 dots) → 7 dots; `from ......models import Game` (6 dots) → 7 dots; `from ....factions._faction_summary import character_faction_summary` (4 dots) → 5 dots.
- `game_pc_faction_summary_all.py`: `from ......decorators import restricted` (6 dots) → 7 dots; `from ......models import Game` (6 dots) → 7 dots; `from ...._shared import _get_character_or_404` (4 dots) → 5 dots; `from ....factions._faction_summary import (...)` (4 dots) → 5 dots.

Add a docstring-only `backend/games/views/game/pcs/detail/factions/detail/__init__.py` mirroring `backend/games/views/game/pcs/detail/__init__.py`'s style, move the mirrored test files into `backend/games/tests/views/game/pcs/detail/factions/detail/`, and update the 8 corresponding import lines in `backend/games/views/game/pcs/__init__.py` from `.detail.factions.<module>` to `.detail.factions.detail.<module>`.

## Files to Change

- `backend/games/views/game/npcs/detail/factions/game_npc_faction_detail.py`, `game_npc_faction_detail_full.py`, `game_npc_faction_acquire.py`, `game_npc_faction_acquire_all.py`, `game_npc_faction_remove.py`, `game_npc_faction_remove_all.py`, `game_npc_faction_summary.py`, `game_npc_faction_summary_all.py` — move to `.../factions/detail/`, bump every relative import by 1 dot (see Step 1)
- `backend/games/views/game/npcs/detail/factions/detail/__init__.py` — new, docstring-only
- `backend/games/tests/views/game/npcs/detail/factions/game_npc_faction_*_test.py` (8 files) — move to `.../factions/detail/`
- `backend/games/views/game/npcs/__init__.py` — update 8 `from .detail.factions.<module>` re-export lines to `from .detail.factions.detail.<module>`
- `backend/games/views/game/pcs/detail/factions/game_pc_faction_detail.py`, `game_pc_faction_detail_full.py`, `game_pc_faction_acquire.py`, `game_pc_faction_acquire_all.py`, `game_pc_faction_remove.py`, `game_pc_faction_remove_all.py`, `game_pc_faction_summary.py`, `game_pc_faction_summary_all.py` — move to `.../factions/detail/`, bump every relative import by 1 dot (see Step 2)
- `backend/games/views/game/pcs/detail/factions/detail/__init__.py` — new, docstring-only
- `backend/games/tests/views/game/pcs/detail/factions/game_pc_faction_*_test.py` (8 files) — move to `.../factions/detail/`
- `backend/games/views/game/pcs/__init__.py` — update 8 `from .detail.factions.<module>` re-export lines to `from .detail.factions.detail.<module>`

No changes to `backend/games/urls.py` or any `urls/` file — they import from the `npcs`/`pcs` package's `__init__.py`, whose public symbol names are unchanged.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/` (CI job: `pytest_views_characters`)

## Notes

- Purely structural — no logic, route, or behavior changes; every moved file is a 1-line factory wrapper around `_faction_shared.py`, except the two `summary`/`summary_all` files, which are small hand-written views that also import from `decorators`, `models`, and `factions/_faction_summary.py` — all of those relative imports need the same +1 dot bump.
- The 4 collection files and their tests are unaffected and must not move.
- The existing NPC/PC asymmetry (`game_pc_faction_summary_all.py` imports `_get_character_or_404` from `_shared`; the NPC equivalent does not) is pre-existing and out of scope — preserve it as-is, just bump its import depth.

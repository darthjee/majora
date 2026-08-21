# Backend Plan: Split 'photos' sub-resource views into detail/ (PC/NPC)

Main plan: [plan.md](plan.md)

## Overview

Per the [Views Organization Convention](../../views-organization.md),
member actions on a single item live in a `detail/` subfolder inside that resource's own
folder. `backend/games/views/game/{npcs,pcs}/detail/photos/` currently mixes the NPC/PC's own
photo-collection listing with member actions on a single photo, flat in the same folder. This
plan moves the 3 member-action files into a new `photos/detail/` subfolder for both the `npcs`
and `pcs` trees, mirroring the already-merged #1227 (documents), #1229 (items), and #1230
(possessions) splits. Purely structural — no logic changes.

## Context

- Every member-action file (`game_npc_photo_detail.py`, `game_npc_photo_set.py`,
  `game_npc_photo_deletable.py`, and PC mirrors) is a 1-line factory wrapper around
  `backend/games/views/game/_photo_shared.py`.
- Current relative import: `from ...._photo_shared import ...` (4 dots up to `game/`). After
  the move, one level deeper, so 5 dots: `from ....._photo_shared import ...`.
- `game_npc_photos.py` / `game_pc_photos.py` (the collection listing) stay in `photos/`.
- `game_npc_photo_upload.py` / `game_pc_photo_upload.py` are out of scope — they already live
  directly in `npcs/detail/` / `pcs/detail/`, not in the `photos/` folder.
- Confirmed against the codebase: sibling `detail/__init__.py` files created by the
  #1227/#1229/#1230 splits (`documents/detail/`, `items/detail/`, `possessions/detail/`) are
  docstring-only modules, not re-exports — `photos/detail/__init__.py` follows the same style.
- The parent `photos/__init__.py` docstrings currently read `"""Views for a single NPC's
  nested photos (list, and per-photo role set)."""` (PC mirror analogous) — sibling
  collection-folder docstrings all read `"(list)"` after their splits, so these must be
  trimmed too.

## Implementation Steps

### Step 1 — Split the NPC `photos/` folder

- Create `backend/games/views/game/npcs/detail/photos/detail/__init__.py` — docstring-only,
  e.g. `"""Member-action views for a single NPC's photo."""`.
- Move `game_npc_photo_detail.py`, `game_npc_photo_set.py`, `game_npc_photo_deletable.py` from
  `backend/games/views/game/npcs/detail/photos/` into
  `backend/games/views/game/npcs/detail/photos/detail/`, filenames unchanged.
- In each of the 3 moved files, bump the relative import from `from ...._photo_shared import
  ...` to `from ....._photo_shared import ...` (5 dots).
- Move the 3 mirrored test files from
  `backend/games/tests/views/game/npcs/detail/photos/` into
  `backend/games/tests/views/game/npcs/detail/photos/detail/` (same filenames). No
  `__init__.py` needed in the new test folder — confirmed against the codebase, the sibling
  nested test `detail/` folders (e.g.
  `backend/games/tests/views/game/npcs/detail/items/detail/`) don't have one.
- Update `backend/games/views/game/npcs/detail/photos/__init__.py`'s docstring to
  `"""Views for a single NPC's nested photos (list)."""`.
- In `backend/games/views/game/npcs/__init__.py`, update the 3 moved symbols' import lines
  from `from .detail.photos.<module> import <name>` to
  `from .detail.photos.detail.<module> import <name>`. Leave the `game_npc_photos` import line
  unchanged.

### Step 2 — Mirror for the `pcs/` tree

Repeat Step 1 exactly for `backend/games/views/game/pcs/detail/photos/` and
`backend/games/tests/views/game/pcs/detail/photos/`, using `game_pc_*` filenames, updating
`backend/games/views/game/pcs/detail/photos/__init__.py` and
`backend/games/views/game/pcs/__init__.py` the same way.

## Files to Change

- `backend/games/views/game/npcs/detail/photos/game_npc_photo_detail.py` — move to `photos/detail/`, bump import depth
- `backend/games/views/game/npcs/detail/photos/game_npc_photo_set.py` — move to `photos/detail/`, bump import depth
- `backend/games/views/game/npcs/detail/photos/game_npc_photo_deletable.py` — move to `photos/detail/`, bump import depth
- `backend/games/views/game/npcs/detail/photos/detail/__init__.py` — new, docstring-only
- `backend/games/views/game/npcs/detail/photos/__init__.py` — trim docstring, drop "role set" mention
- `backend/games/views/game/npcs/__init__.py` — update 3 re-export import paths
- `backend/games/tests/views/game/npcs/detail/photos/game_npc_photo_detail_test.py` — move to `photos/detail/`
- `backend/games/tests/views/game/npcs/detail/photos/game_npc_photo_set_test.py` — move to `photos/detail/`
- `backend/games/tests/views/game/npcs/detail/photos/game_npc_photo_deletable_test.py` — move to `photos/detail/`
- `backend/games/views/game/pcs/detail/photos/game_pc_photo_detail.py` — move to `photos/detail/`, bump import depth
- `backend/games/views/game/pcs/detail/photos/game_pc_photo_set.py` — move to `photos/detail/`, bump import depth
- `backend/games/views/game/pcs/detail/photos/game_pc_photo_deletable.py` — move to `photos/detail/`, bump import depth
- `backend/games/views/game/pcs/detail/photos/detail/__init__.py` — new, docstring-only
- `backend/games/views/game/pcs/detail/photos/__init__.py` — trim docstring, drop "role set" mention
- `backend/games/views/game/pcs/__init__.py` — update 3 re-export import paths
- `backend/games/tests/views/game/pcs/detail/photos/game_pc_photo_detail_test.py` — move to `photos/detail/`
- `backend/games/tests/views/game/pcs/detail/photos/game_pc_photo_set_test.py` — move to `photos/detail/`
- `backend/games/tests/views/game/pcs/detail/photos/game_pc_photo_deletable_test.py` — move to `photos/detail/`

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`)

## Notes

- No URLconf changes needed — `urls.py` imports from the `npcs`/`pcs` package's `__init__.py`,
  which keeps exporting the same names.
- No behavior change; this is a pure file-move + import-depth-bump + docstring trim.

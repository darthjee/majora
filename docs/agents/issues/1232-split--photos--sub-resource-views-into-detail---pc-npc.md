# Issue: Split 'photos' sub-resource views into detail/ (PC/NPC)

## Problem

Per the [Views Organization Convention](docs/agents/views-organization.md), member actions on
a single item live in a `detail/` subfolder inside that resource's own folder.
`backend/games/views/game/{npcs,pcs}/detail/photos/` currently mixes the NPC/PC's own
photo-collection listing with member actions on a single photo, flat in the same folder:

- **Collection (stays in `photos/`)**: `game_npc_photos.py`
- **Member actions on one photo (→ `photos/detail/`, new folder)**: `game_npc_photo_detail.py`,
  `game_npc_photo_set.py`, `game_npc_photo_deletable.py`

Same 4 files (+ `__init__.py`) mirrored under the `pcs/` tree with `game_pc_*` filenames.

This is purely structural — no logic changes. Every one of the 3 member-action files is a
1-line factory wrapper around `backend/games/views/game/_photo_shared.py`; moving them only
requires updating each moved file's relative import depth (currently `from ...._photo_shared
import ...`, 4 dots up to `game/`; after the move, one level deeper, so 5 dots) plus the two
package re-export files.

Note: `game_npc_photo_upload.py`/`game_pc_photo_upload.py` are **not** part of this folder —
they already live directly in `npcs/detail/`/`pcs/detail/` (a member action on the NPC/PC
itself — uploading *a* photo — not on one specific existing photo), so they are out of scope
for this sub-issue.

## Solution

For both `backend/games/views/game/npcs/detail/photos/` and
`backend/games/views/game/pcs/detail/photos/` (mirror, `game_pc_*` prefix):

1. Move the 3 member-action view files into a new `photos/detail/` subfolder, filenames
   unchanged; the collection file (`game_npc_photos.py`) stays in `photos/`.
2. Move each moved file's mirrored test file alongside it, under
   `backend/games/tests/views/game/{npcs,pcs}/detail/photos/detail/` (same filename, `_test.py`
   suffix).
3. Bump the relative import in each moved file from `from ...._photo_shared import ...`
   (4 dots) to `from ....._photo_shared import ...` (5 dots), to account for the extra
   `detail/` nesting level.
4. Add `photos/detail/__init__.py`, following the sibling `npcs/detail/__init__.py` /
   `pcs/detail/__init__.py` pattern — a docstring-only module (e.g. `"""Member-action views
   for a single NPC's photo."""`), not a re-export file. Confirmed against the codebase: every
   sibling `detail/__init__.py` created by the already-merged #1227/#1229/#1230 splits
   (`documents/detail/`, `items/detail/`, `possessions/detail/`) follows this exact
   docstring-only style.
5. Update `photos/__init__.py`'s own docstring — it currently reads `"""Views for a single
   NPC's nested photos (list, and per-photo role set)."""` and must drop the mention of the
   member action that's moving out, to `"""Views for a single NPC's nested photos (list)."""`,
   matching the sibling collection-folder docstrings (`documents/__init__.py`,
   `items/__init__.py`, `possessions/__init__.py` all read `"(list)"` after their splits).
6. Update, in each of the two package re-export files:
   - `backend/games/views/game/npcs/__init__.py`
   - `backend/games/views/game/pcs/__init__.py`

   the 3 moved symbols' import lines from `from .detail.photos.<module> import <name>` to
   `from .detail.photos.detail.<module> import <name>`. The collection symbol's import line
   (`game_npc_photos`) is unchanged.
7. No URLconf changes needed — `urls.py` imports from the `npcs`/`pcs` package's `__init__.py`,
   which keeps exporting the same names.

### Target structure

```
photos/
├── __init__.py                                   # docstring updated, drops "role set" mention
├── game_npc_photos.py                            # collection (stays)
└── detail/                                        # NEW — member actions
    ├── __init__.py
    ├── game_npc_photo_detail.py
    ├── game_npc_photo_set.py
    └── game_npc_photo_deletable.py
```

Same shape for the `pcs/` tree with `game_pc_*` filenames, and for
`backend/games/tests/views/game/{npcs,pcs}/detail/photos/`.

### Decisions

1. Purely structural move — no behavior changes, no renames.
2. `photos/detail/__init__.py` is a docstring-only module, matching the sibling
   `detail/__init__.py` pattern already used one level up and by every prior split in this
   series (not a re-export file).
3. `photos/__init__.py`'s docstring is updated to drop the reference to the member action
   moving out, matching the sibling collection-folder docstring pattern.

### Acceptance Criteria

- [ ] All 3 member-action view files (×2 trees) moved into `photos/detail/`, filenames
      unchanged; the collection file stays put.
- [ ] All mirrored test files moved alongside their view counterparts.
- [ ] Relative imports in every moved file updated to the correct depth (5 dots).
- [ ] `npcs/__init__.py` and `pcs/__init__.py` re-export paths updated to match.
- [ ] `photos/detail/__init__.py` added, docstring-only.
- [ ] `photos/__init__.py` docstring updated to drop the "per-photo role set" mention.
- [ ] Full backend test suite passes.
- [ ] No behavior change.

### Context

Sub-issue of #1223 ("Refatoração: listar arquivos de views de 'characters' (PC/NPC) para
divisão"). Independent of the other sub-issues split from #1223.

## Benefits

- Makes the file responsible for the `photos/:id/*` routes predictable from its path alone,
  per the documented [Views Organization Convention](docs/agents/views-organization.md).
- Keeps the `photos/` folder's own collection listing cleanly separated from member actions on
  a single photo, matching the pattern already used one level up (`npcs/detail/`,
  `pcs/detail/`) and by every prior sub-resource split in this series.

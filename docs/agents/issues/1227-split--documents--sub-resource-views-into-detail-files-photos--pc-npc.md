# Issue: Split 'documents' sub-resource views into detail/files/photos (PC/NPC)

## Description

Sub-issue of #1223 ("Refatoração: listar arquivos de views de characters (PC/NPC) para divisão"). Purely structural — no behavior changes, no renames. Independent of the other sub-issues split from #1223: it only touches the `documents/` subfolder and the two `npcs`/`pcs` `__init__.py` re-export files, and where those files overlap with sibling sub-issues, the changed import lines are disjoint.

## Problem

Per the [Views Organization Convention](docs/agents/views-organization.md), member actions on a single item live in a `detail/` subfolder, and nested sub-resources live in their own subfolder. `backend/games/views/game/{npcs,pcs}/detail/documents/` currently mixes all three kinds of files flat together: the NPC/PC's own document collection actions, member actions on a single document, and the `files`/`photos` sub-resources nested under a document.

Every file in this folder is already a 1-line factory wrapper around `_document_shared.py` (e.g. `game_npc_document_files = build_document_files_view(npc=True)`), so moves only require updating the relative import depth in each moved file plus the two package re-export files.

## Acceptance Criteria

- [ ] All 16 view files (×2 trees) moved into the correct subfolder per the structure above, filenames unchanged.
- [ ] All mirrored test files moved alongside their view counterparts.
- [ ] Relative imports in every moved file updated to the correct depth; no broken imports.
- [ ] `npcs/__init__.py` and `pcs/__init__.py` re-export paths updated to match.
- [ ] New subfolder `__init__.py` files added as single-line docstrings, matching sibling convention.
- [ ] Full backend test suite passes (`documents` and full-suite run, since `__init__.py` changes affect the whole `npcs`/`pcs` package).
- [ ] No behavior change — this is a pure file/import reorganization.

## Solution

**Affected files** — `backend/games/views/game/npcs/detail/documents/` and `backend/games/views/game/pcs/detail/documents/` (mirror, `game_pc_*` prefix), 17 files each (16 view files + `__init__.py`), verified present in both trees:

- **Collection (stays in `documents/`)**: `game_npc_documents.py`, `game_npc_documents_all.py`, `game_npc_documents_available.py`, `game_npc_documents_available_all.py`
- **Member actions on one document (→ `documents/detail/`, new folder)**: `game_npc_document_detail.py`, `game_npc_document_detail_full.py`, `game_npc_document_acquire.py`, `game_npc_document_acquire_all.py`, `game_npc_document_remove.py`, `game_npc_document_remove_all.py`, `game_npc_document_summary.py`, `game_npc_document_summary_all.py`
- **`files` sub-resource of a document (→ `documents/files/`, new folder)**: `game_npc_document_files.py`, `game_npc_document_files_all.py`
- **`photos` sub-resource of a document (→ `documents/photos/`, new folder)**: `game_npc_document_photos.py`, `game_npc_document_photos_all.py`

Their mirrored test files under `backend/games/tests/views/game/{npcs,pcs}/detail/documents/` move alongside (same filename, `_test.py` suffix).

Also update, in each of the two `__init__.py` re-export files:
- `backend/games/views/game/npcs/__init__.py`
- `backend/games/views/game/pcs/__init__.py`

to point each moved symbol's `from .detail.documents.<module> import <name>` line at its new subpath (e.g. `.detail.documents.detail.<module>`, `.detail.documents.files.<module>`, `.detail.documents.photos.<module>`).

**Decisions:**

1. Purely structural move — no behavior changes, no renames (filenames are preserved).
2. Each moved file's relative import to `_document_shared.py` gains one `..` level (files moving from `documents/` into `documents/detail/`, `documents/files/`, or `documents/photos/` go from 4 levels up to 5, e.g. `from ...._document_shared import ...` becomes `from ....._document_shared import ...`).
3. `_all`/`_full`/`_available` variants stay as separate files (different serializers/permissions) — do not consolidate them.
4. New subfolder `__init__.py` files (`documents/detail/`, `documents/files/`, `documents/photos/`) are a single docstring line only, no re-exports. Confirmed against the established sibling pattern by checking `npcs/detail/items/__init__.py`, `npcs/detail/possessions/__init__.py`, and `npcs/detail/photos/__init__.py`, which all follow this style (e.g. a one-line module docstring describing the nested resource).
5. No URLconf changes needed — `urls.py` imports from the `npcs`/`pcs` package's `__init__.py`, not from individual submodules directly.

**Target structure** (same shape for `pcs/` with `game_pc_*` filenames, and for `backend/games/tests/views/game/{npcs,pcs}/detail/documents/`):

```
documents/
├── game_npc_documents.py                        # collection (stays)
├── game_npc_documents_all.py
├── game_npc_documents_available.py
├── game_npc_documents_available_all.py
├── detail/                                       # NEW — member actions
│   ├── __init__.py
│   ├── game_npc_document_detail.py
│   ├── game_npc_document_detail_full.py
│   ├── game_npc_document_acquire.py
│   ├── game_npc_document_acquire_all.py
│   ├── game_npc_document_remove.py
│   ├── game_npc_document_remove_all.py
│   ├── game_npc_document_summary.py
│   └── game_npc_document_summary_all.py
├── files/                                        # NEW — sub-resource
│   ├── __init__.py
│   ├── game_npc_document_files.py
│   └── game_npc_document_files_all.py
└── photos/                                       # NEW — sub-resource
    ├── __init__.py
    ├── game_npc_document_photos.py
    └── game_npc_document_photos_all.py
```

## Benefits

Brings `documents/` in line with the [Views Organization Convention](docs/agents/views-organization.md) already followed by sibling sub-resource folders, making member-action vs. sub-resource views easier to locate and keeping the pattern consistent across the `npcs`/`pcs` view trees.

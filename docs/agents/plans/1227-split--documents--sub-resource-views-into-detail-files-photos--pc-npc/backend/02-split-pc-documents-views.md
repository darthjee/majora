# Split PC documents views into detail/files/photos

Mirror of step 01 for the `pcs/` tree: reorganize `backend/games/views/game/pcs/detail/documents/` the same way, with `game_pc_*` filenames instead of `game_npc_*`. Same rules apply — 1-line factory wrappers around `_document_shared.py`, import depth 4→5 for every moved file, mirrored test files moved alongside with no import changes, new subfolder `__init__.py` files as single-line docstrings.

Files that stay in `documents/` untouched: `game_pc_documents.py`, `game_pc_documents_all.py`, `game_pc_documents_available.py`, `game_pc_documents_available_all.py`.

## Files to Change

- `backend/games/views/game/pcs/detail/documents/detail/__init__.py` — new, one-line docstring.
- `backend/games/views/game/pcs/detail/documents/detail/game_pc_document_detail.py` — moved from `documents/`, import depth 4→5.
- `backend/games/views/game/pcs/detail/documents/detail/game_pc_document_detail_full.py` — moved, import depth 4→5.
- `backend/games/views/game/pcs/detail/documents/detail/game_pc_document_acquire.py` — moved, import depth 4→5.
- `backend/games/views/game/pcs/detail/documents/detail/game_pc_document_acquire_all.py` — moved, import depth 4→5.
- `backend/games/views/game/pcs/detail/documents/detail/game_pc_document_remove.py` — moved, import depth 4→5.
- `backend/games/views/game/pcs/detail/documents/detail/game_pc_document_remove_all.py` — moved, import depth 4→5.
- `backend/games/views/game/pcs/detail/documents/detail/game_pc_document_summary.py` — moved, import depth 4→5.
- `backend/games/views/game/pcs/detail/documents/detail/game_pc_document_summary_all.py` — moved, import depth 4→5.
- `backend/games/views/game/pcs/detail/documents/files/__init__.py` — new, one-line docstring.
- `backend/games/views/game/pcs/detail/documents/files/game_pc_document_files.py` — moved, import depth 4→5.
- `backend/games/views/game/pcs/detail/documents/files/game_pc_document_files_all.py` — moved, import depth 4→5.
- `backend/games/views/game/pcs/detail/documents/photos/__init__.py` — new, one-line docstring.
- `backend/games/views/game/pcs/detail/documents/photos/game_pc_document_photos.py` — moved, import depth 4→5.
- `backend/games/views/game/pcs/detail/documents/photos/game_pc_document_photos_all.py` — moved, import depth 4→5.
- `backend/games/tests/views/game/pcs/detail/documents/detail/game_pc_document_{detail,detail_full,acquire,acquire_all,remove,remove_all,summary,summary_all}_test.py` — moved, no content changes.
- `backend/games/tests/views/game/pcs/detail/documents/files/game_pc_document_{files,files_all}_test.py` — moved, no content changes.
- `backend/games/tests/views/game/pcs/detail/documents/photos/game_pc_document_{photos,photos_all}_test.py` — moved, no content changes.

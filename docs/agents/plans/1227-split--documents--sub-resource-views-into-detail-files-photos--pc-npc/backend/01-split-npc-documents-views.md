# Split NPC documents views into detail/files/photos

Reorganize `backend/games/views/game/npcs/detail/documents/` from a flat folder into `documents/` (collection, unchanged), `documents/detail/` (member actions), `documents/files/`, and `documents/photos/`. Every moved file is a 1-line factory wrapper around `_document_shared.py`; only its relative import path changes, gaining one `..` level (4 levels up → 5) because it now sits one directory deeper. Move the mirrored test files under `backend/games/tests/views/game/npcs/detail/documents/` alongside their view counterparts (same filename, `_test.py` suffix) — these need no import changes, since they reference views only through `reverse()` URL names, not direct module imports.

Create each new subfolder's `__init__.py` as a single one-line module docstring (no re-exports), matching the convention in `npcs/detail/items/__init__.py`, `npcs/detail/possessions/__init__.py`, and `npcs/detail/photos/__init__.py`.

Files that stay in `documents/` untouched (no import change): `game_npc_documents.py`, `game_npc_documents_all.py`, `game_npc_documents_available.py`, `game_npc_documents_available_all.py`.

## Files to Change

- `backend/games/views/game/npcs/detail/documents/detail/__init__.py` — new, one-line docstring.
- `backend/games/views/game/npcs/detail/documents/detail/game_npc_document_detail.py` — moved from `documents/`, import depth 4→5.
- `backend/games/views/game/npcs/detail/documents/detail/game_npc_document_detail_full.py` — moved, import depth 4→5.
- `backend/games/views/game/npcs/detail/documents/detail/game_npc_document_acquire.py` — moved, import depth 4→5.
- `backend/games/views/game/npcs/detail/documents/detail/game_npc_document_acquire_all.py` — moved, import depth 4→5.
- `backend/games/views/game/npcs/detail/documents/detail/game_npc_document_remove.py` — moved, import depth 4→5.
- `backend/games/views/game/npcs/detail/documents/detail/game_npc_document_remove_all.py` — moved, import depth 4→5.
- `backend/games/views/game/npcs/detail/documents/detail/game_npc_document_summary.py` — moved, import depth 4→5.
- `backend/games/views/game/npcs/detail/documents/detail/game_npc_document_summary_all.py` — moved, import depth 4→5.
- `backend/games/views/game/npcs/detail/documents/files/__init__.py` — new, one-line docstring.
- `backend/games/views/game/npcs/detail/documents/files/game_npc_document_files.py` — moved, import depth 4→5.
- `backend/games/views/game/npcs/detail/documents/files/game_npc_document_files_all.py` — moved, import depth 4→5.
- `backend/games/views/game/npcs/detail/documents/photos/__init__.py` — new, one-line docstring.
- `backend/games/views/game/npcs/detail/documents/photos/game_npc_document_photos.py` — moved, import depth 4→5.
- `backend/games/views/game/npcs/detail/documents/photos/game_npc_document_photos_all.py` — moved, import depth 4→5.
- `backend/games/tests/views/game/npcs/detail/documents/detail/game_npc_document_{detail,detail_full,acquire,acquire_all,remove,remove_all,summary,summary_all}_test.py` — moved, no content changes.
- `backend/games/tests/views/game/npcs/detail/documents/files/game_npc_document_{files,files_all}_test.py` — moved, no content changes.
- `backend/games/tests/views/game/npcs/detail/documents/photos/game_npc_document_{photos,photos_all}_test.py` — moved, no content changes.

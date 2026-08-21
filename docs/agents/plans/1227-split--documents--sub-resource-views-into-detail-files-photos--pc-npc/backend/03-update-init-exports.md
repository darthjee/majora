# Update npcs/pcs __init__.py re-export paths

Update the `from .detail.documents.<module> import <name>` lines in the two package `__init__.py` files so each moved symbol points at its new subpath. The `__all__`/export names themselves are unchanged — only the `from ...` path per moved symbol.

For `npcs/__init__.py` (mirror for `pcs/__init__.py` with `game_pc_*` names):
- `.detail.documents.game_npc_document_detail` → `.detail.documents.detail.game_npc_document_detail`
- `.detail.documents.game_npc_document_detail_full` → `.detail.documents.detail.game_npc_document_detail_full`
- `.detail.documents.game_npc_document_acquire` → `.detail.documents.detail.game_npc_document_acquire`
- `.detail.documents.game_npc_document_acquire_all` → `.detail.documents.detail.game_npc_document_acquire_all`
- `.detail.documents.game_npc_document_remove` → `.detail.documents.detail.game_npc_document_remove`
- `.detail.documents.game_npc_document_remove_all` → `.detail.documents.detail.game_npc_document_remove_all`
- `.detail.documents.game_npc_document_summary` → `.detail.documents.detail.game_npc_document_summary`
- `.detail.documents.game_npc_document_summary_all` → `.detail.documents.detail.game_npc_document_summary_all`
- `.detail.documents.game_npc_document_files` → `.detail.documents.files.game_npc_document_files`
- `.detail.documents.game_npc_document_files_all` → `.detail.documents.files.game_npc_document_files_all`
- `.detail.documents.game_npc_document_photos` → `.detail.documents.photos.game_npc_document_photos`
- `.detail.documents.game_npc_document_photos_all` → `.detail.documents.photos.game_npc_document_photos_all`

Lines importing `game_npc_documents`, `game_npc_documents_all`, `game_npc_documents_available`, `game_npc_documents_available_all` are unchanged — those stay in `documents/`.

## Files to Change

- `backend/games/views/game/npcs/__init__.py` — update the 12 `from .detail.documents.<module> import <name>` lines listed above to their new subpaths.
- `backend/games/views/game/pcs/__init__.py` — same 12 updates, mirrored with `game_pc_*` names.

# Move documents domain

Move the 6 documents-related flat files from `backend/games/views/game/` into a
new `backend/games/views/game/documents/` package (with an `__init__.py`),
keeping filenames unchanged, then fix up every import that breaks as a result.

Within the new `documents/` package, sibling imports between these 6 files stay
single-dot (`.`) since they move together. Imports that reach outside the
package — to `_decorators`/`_shared` (staying at `game/` root), `..common`,
`...models`, `...serializers`, or (for `_document_exchange.py`) `..games._treasure_filters`
— need one extra `.` to account for the new nesting level.

## Files to Change
- `backend/games/views/game/_document_content.py` → `backend/games/views/game/documents/_document_content.py` (move; update its `from ._documents import ...`-style outward imports)
- `backend/games/views/game/_document_exchange.py` → `backend/games/views/game/documents/_document_exchange.py` (move; update outward imports incl. `..games._treasure_filters` → `...games._treasure_filters`)
- `backend/games/views/game/_document_files.py` → `backend/games/views/game/documents/_document_files.py` (move; keep sibling `from ._document_content import ...` as-is)
- `backend/games/views/game/_document_photos.py` → `backend/games/views/game/documents/_document_photos.py` (move; keep sibling `from ._document_content import ...` as-is)
- `backend/games/views/game/_document_summary.py` → `backend/games/views/game/documents/_document_summary.py` (move; keep sibling `from ._document_exchange import _find_game_document` as-is)
- `backend/games/views/game/_documents.py` → `backend/games/views/game/documents/_documents.py` (move; update outward imports)
- `backend/games/views/game/documents/__init__.py` (new, empty — makes the folder a package)
- `backend/games/views/game/_character_shared.py` — update its imports of `_document_exchange`, `_document_files`, `_document_photos`, `_documents` to `documents._document_exchange`, `documents._document_files`, `documents._document_photos`, `documents._documents`
- `backend/games/views/game/pcs/detail/documents/game_pc_document_summary.py` — update `from ...._document_summary import character_document_summary` to `from ....documents._document_summary import character_document_summary`
- `backend/games/views/game/pcs/detail/documents/game_pc_document_summary_all.py` — same `_document_summary` import update
- `backend/games/views/game/npcs/detail/documents/game_npc_document_summary.py` — same `_document_summary` import update
- `backend/games/views/game/npcs/detail/documents/game_npc_document_summary_all.py` — same `_document_summary` import update

# Fix imports in the unmoved granular resource folders and npcs/pcs root files

These files do **not** move, but import one of the 6 moved modules (`_shared`, `_decorators`, `_detail`, `_regular`, `_character_shared`, `_treasure_finder`) directly rather than through a `_*_shared.py` hub. Same rule as Step 4 — leading dot count unchanged, forward path gains `_character.` (and `treasures.` for `_treasure_finder`), and `_character_shared` drops its `_shared` suffix.

Known references as of this plan (re-grep before editing — the exact set may shift if a sibling sub-issue lands between now and implementation):

- `backend/games/views/game/pcs/game_pcs.py`: `from .._shared import ...` → `from .._character._shared import ...`
- `backend/games/views/game/pcs/game_pc_detail.py`: `from .._detail import character_detail` → `from .._character._detail import character_detail`; `from .._regular import character_regular_update` → `from .._character._regular import character_regular_update`; `from .._shared import _get_character_or_404` → `from .._character._shared import _get_character_or_404`
- `backend/games/views/game/pcs/detail/game_pc_full.py`, `game_pc_access.py`: `from ..._character_shared import ...` → `from ..._character import ...`
- `backend/games/views/game/pcs/detail/treasures/game_pc_treasure_summary_all.py`, `pcs/detail/factions/game_pc_faction_summary_all.py`, `pcs/detail/documents/detail/game_pc_document_summary_all.py`, `pcs/detail/items/detail/game_pc_item_summary_all.py`: `from ...._shared import ...` / `from ....._shared import ...` (depth varies by file) → same dot count, forward path `_character._shared`
- `backend/games/views/game/npcs/_npc_player_update.py`: `from .._shared import ...` → `from .._character._shared import ...`
- `backend/games/views/game/npcs/detail/game_npc_access.py`, `game_npc_full.py`: `from ..._character_shared import ...` → `from ..._character import ...`
- `backend/games/views/game/npcs/game_npc_detail.py`: `from .._detail import character_detail` → `from .._character._detail import character_detail`
- `backend/games/views/game/npcs/game_npcs.py`, `game_npcs_all.py`: `from .._shared import ...` → `from .._character._shared import ...`
- `backend/games/views/game/treasures/_treasure_exchange.py`: `from .._shared import _character_resource` → `from .._character._shared import _character_resource`; `from .._treasure_finder import ...` → `from .._character.treasures._treasure_finder import ...`
- Every other file in `backend/games/views/game/{documents,factions,items,photos,possessions,treasures}/` importing `_decorators` or `_shared` (dot count is uniformly 2 across this whole group — `from .._decorators import ...` → `from .._character._decorators import ...`, `from .._shared import ...` → `from .._character._shared import ...`): includes at least `documents/_document_exchange.py`, `documents/_documents.py`, `documents/_document_summary.py`, `documents/_document_content.py`, `factions/_faction_exchange.py`, `factions/_factions.py`, `factions/_faction_summary.py`, `items/_item_exchange.py`, `items/_item_create.py`, `items/_items.py`, `items/_item_photo_upload.py`, `items/_item_summary.py`, `items/_item_update.py`, `photos/_photo_set.py`, `photos/_photos.py`, `photos/_photo_upload.py`, `photos/_photo_detail.py`, `photos/_photo_deletable.py`, `possessions/_possession_create.py`, `possessions/_possession_exchange.py`, `possessions/_possessions.py`, `treasures/_treasures.py`, `treasures/_treasure_summary.py`

Grep for the full current set before starting, to catch anything added or changed since this plan was written:

```bash
grep -rnE "from \.+(_shared|_decorators|_detail|_full|_regular|_character_shared|_treasure_finder) import" backend/games/views/game --include="*.py" | grep -v "^backend/games/views/game/_character/"
```

## Files to Change

- All files listed above — forward-path-only import fixes, no file moves

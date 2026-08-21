# Fix wrapper-view imports across game/{npcs,pcs}/detail/**

None of the wrapper view files under `game/{npcs,pcs}/detail/**` move in this issue — only the shared modules they import do. For every wrapper file, keep its existing leading-dot count exactly as-is and rewrite only the forward module path:

- `_character_shared` → `_character` (drop the `_shared` suffix; import straight from the package)
- `_document_shared` → `_character.documents._document_shared`
- `_faction_shared` → `_character.factions._faction_shared`
- `_item_shared` → `_character.items._item_shared`
- `_photo_shared` → `_character.photos._photo_shared`
- `_possession_shared` → `_character.possessions._possession_shared`
- `_treasure_shared` → `_character.treasures._treasure_shared`

Examples verified against current files:

- `backend/games/views/game/npcs/detail/factions/game_npc_faction_detail.py`: `from ...._faction_shared import build_faction_detail_view` → `from ...._character.factions._faction_shared import build_faction_detail_view`
- `backend/games/views/game/npcs/detail/game_npc_full.py`: `from ..._character_shared import build_full_view` → `from ..._character import build_full_view`
- `backend/games/views/game/pcs/detail/game_pc_access.py`: `from ..._character_shared import build_access_view` → `from ..._character import build_access_view`

As of this plan, roughly 125 import statements across roughly 115 wrapper files reference these 7 modules (counts by module: `_character_shared` 10, `_document_shared` 28, `_faction_shared` 20, `_item_shared` 22, `_photo_shared` 10, `_possession_shared` 20, `_treasure_shared` 14). A scripted search-and-replace per module name (grep for the import line, sed the forward path) is much less error-prone than editing files individually — the leading-dot count is untouched in every case, only the text after the dots changes.

Only edit files that currently exist. Sub-resources whose sibling split issue has already landed have their wrapper files one directory level deeper than a sub-resource still flat — either way the "same dot count, new forward path" rule holds; just verify the actual current dot count per file rather than assuming the two example depths above cover every case.

## Files to Change

- Every `.py` file under `backend/games/views/game/npcs/**` and `backend/games/views/game/pcs/**` that imports one of the 7 modules listed above — forward path only, no file moves

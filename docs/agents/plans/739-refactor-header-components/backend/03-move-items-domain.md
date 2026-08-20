# Move items domain

Move the 6 items-related flat files from `backend/games/views/game/` into a
new `backend/games/views/game/items/` package (with an `__init__.py`), keeping
filenames unchanged, then fix up every import that breaks as a result.

Same rule as the documents domain: sibling imports within `items/` stay
single-dot; imports reaching outside the package (`_decorators`, `_shared`,
`..common`, `...models`, `...serializers`, `..games._treasure_filters` for
`_item_exchange.py`) need one extra `.`.

## Files to Change
- `backend/games/views/game/_item_create.py` → `backend/games/views/game/items/_item_create.py` (move; update outward imports)
- `backend/games/views/game/_item_exchange.py` → `backend/games/views/game/items/_item_exchange.py` (move; update outward imports incl. `..games._treasure_filters` → `...games._treasure_filters`)
- `backend/games/views/game/_item_photo_upload.py` → `backend/games/views/game/items/_item_photo_upload.py` (move; update outward imports)
- `backend/games/views/game/_item_summary.py` → `backend/games/views/game/items/_item_summary.py` (move; update outward imports)
- `backend/games/views/game/_item_update.py` → `backend/games/views/game/items/_item_update.py` (move; update outward imports)
- `backend/games/views/game/_items.py` → `backend/games/views/game/items/_items.py` (move; update outward imports)
- `backend/games/views/game/items/__init__.py` (new, empty — makes the folder a package)
- `backend/games/views/game/_character_shared.py` — update its imports of `_item_create`, `_item_exchange`, `_item_photo_upload`, `_item_update`, `_items` to `items._item_create`, `items._item_exchange`, `items._item_photo_upload`, `items._item_update`, `items._items`
- `backend/games/views/game/pcs/detail/items/game_pc_item_summary.py` — update `from ...._item_summary import character_item_summary` to `from ....items._item_summary import character_item_summary`
- `backend/games/views/game/pcs/detail/items/game_pc_item_summary_all.py` — same `_item_summary` import update
- `backend/games/views/game/npcs/detail/items/game_npc_item_summary.py` — same `_item_summary` import update
- `backend/games/views/game/npcs/detail/items/game_npc_item_summary_all.py` — same `_item_summary` import update

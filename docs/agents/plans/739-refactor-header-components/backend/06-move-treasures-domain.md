# Move treasures domain

Move the 3 treasures-related flat files from `backend/games/views/game/` into
a new `backend/games/views/game/treasures/` package (with an `__init__.py`),
keeping filenames unchanged, then fix up every import that breaks as a
result.

Sibling imports within `treasures/` stay single-dot; imports reaching outside
the package (`_decorators`, `_shared`, `..common`, `...models`,
`...serializers`) need one extra `.`. Note `_treasure_exchange.py` does not
import `..games._treasure_filters` (unlike the document/faction/item/possession
exchange files), so no adjustment needed there for that particular import.

## Files to Change
- `backend/games/views/game/_treasure_exchange.py` → `backend/games/views/game/treasures/_treasure_exchange.py` (move; update outward imports)
- `backend/games/views/game/_treasure_summary.py` → `backend/games/views/game/treasures/_treasure_summary.py` (move; update outward imports)
- `backend/games/views/game/_treasures.py` → `backend/games/views/game/treasures/_treasures.py` (move; update outward imports)
- `backend/games/views/game/treasures/__init__.py` (new, empty — makes the folder a package)
- `backend/games/views/game/_character_shared.py` — update its imports of `_treasure_exchange`, `_treasures` to `treasures._treasure_exchange`, `treasures._treasures`
- `backend/games/views/game/pcs/detail/treasures/game_pc_treasure_summary.py` — update `from ...._treasure_summary import character_treasure_summary` to `from ....treasures._treasure_summary import character_treasure_summary`
- `backend/games/views/game/pcs/detail/treasures/game_pc_treasure_summary_all.py` — same `_treasure_summary` import update
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasure_summary.py` — same `_treasure_summary` import update
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasure_summary_all.py` — same `_treasure_summary` import update
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasures_all.py` — update `from ...._treasures import character_treasures` to `from ....treasures._treasures import character_treasures`

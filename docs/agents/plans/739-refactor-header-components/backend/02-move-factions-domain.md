# Move factions domain

Move the 3 factions-related flat files from `backend/games/views/game/` into a
new `backend/games/views/game/factions/` package (with an `__init__.py`),
keeping filenames unchanged, then fix up every import that breaks as a result.

Same rule as the documents domain: sibling imports within `factions/` stay
single-dot; imports reaching outside the package (`_decorators`, `_shared`,
`..common`, `...models`, `...serializers`, `..games._treasure_filters` for
`_faction_exchange.py`) need one extra `.`.

## Files to Change
- `backend/games/views/game/_faction_exchange.py` → `backend/games/views/game/factions/_faction_exchange.py` (move; update outward imports incl. `..games._treasure_filters` → `...games._treasure_filters`)
- `backend/games/views/game/_faction_summary.py` → `backend/games/views/game/factions/_faction_summary.py` (move; update outward imports)
- `backend/games/views/game/_factions.py` → `backend/games/views/game/factions/_factions.py` (move; update outward imports)
- `backend/games/views/game/factions/__init__.py` (new, empty — makes the folder a package)
- `backend/games/views/game/_character_shared.py` — update its imports of `_faction_exchange`, `_factions` to `factions._faction_exchange`, `factions._factions`
- `backend/games/views/game/pcs/detail/factions/game_pc_faction_summary.py` — update `from ...._faction_summary import character_faction_summary` to `from ....factions._faction_summary import character_faction_summary`
- `backend/games/views/game/pcs/detail/factions/game_pc_faction_summary_all.py` — same `_faction_summary` import update
- `backend/games/views/game/npcs/detail/factions/game_npc_faction_summary.py` — same `_faction_summary` import update
- `backend/games/views/game/npcs/detail/factions/game_npc_faction_summary_all.py` — same `_faction_summary` import update

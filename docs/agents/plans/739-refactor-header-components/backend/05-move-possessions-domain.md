# Move possessions domain

Move the 3 possessions-related flat files from `backend/games/views/game/`
into a new `backend/games/views/game/possessions/` package (with an
`__init__.py`), keeping filenames unchanged, then fix up every import that
breaks as a result.

No file outside `_character_shared.py` imports these flat files directly (no
consumer files in `pcs/detail/possessions/` or `npcs/detail/possessions/`
import them). Sibling imports within `possessions/` stay single-dot; imports
reaching outside the package (`_decorators`, `_shared`, `..common`,
`...models`, `...serializers`, `..games._treasure_filters` for
`_possession_exchange.py`) need one extra `.`.

## Files to Change
- `backend/games/views/game/_possession_create.py` → `backend/games/views/game/possessions/_possession_create.py` (move; update outward imports)
- `backend/games/views/game/_possession_exchange.py` → `backend/games/views/game/possessions/_possession_exchange.py` (move; update outward imports incl. `..games._treasure_filters` → `...games._treasure_filters`)
- `backend/games/views/game/_possessions.py` → `backend/games/views/game/possessions/_possessions.py` (move; update outward imports)
- `backend/games/views/game/possessions/__init__.py` (new, empty — makes the folder a package)
- `backend/games/views/game/_character_shared.py` — update its imports of `_possession_create`, `_possession_exchange`, `_possessions` to `possessions._possession_create`, `possessions._possession_exchange`, `possessions._possessions`

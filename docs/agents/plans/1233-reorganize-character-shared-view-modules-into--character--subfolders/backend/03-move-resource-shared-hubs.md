# Move the 6 resource-shared hubs and _treasure_finder.py

Move these 7 files into their per-resource subfolder under `_character/`. Each moves *two* package levels deeper than today (`game/` → `game/_character/<resource>/`), so:

- Any import reaching outside `_character/` entirely (`...models`, `...serializers`, `..common`) gains **two** leading dots.
- The import of `_character_shared` (now the `_character` package itself, from Step 2) and, where present, of `_shared` (now `_character/_shared.py`) gain **one** leading dot and drop straight to the package/module one level up: `from ._character_shared import X` → `from .. import X`; `from ._shared import X` → `from .._shared import X`.
- The import of the file's own unmoved sibling folder under `game/<resource>/` (e.g. `.factions._faction_exchange`) gains **two** leading dots, forward path unchanged: `from .factions._faction_exchange import X` → `from ...factions._faction_exchange import X`.

Moves:

- `_document_shared.py` → `_character/documents/_document_shared.py`
- `_faction_shared.py` → `_character/factions/_faction_shared.py`
- `_item_shared.py` → `_character/items/_item_shared.py`
- `_photo_shared.py` → `_character/photos/_photo_shared.py`
- `_possession_shared.py` → `_character/possessions/_possession_shared.py`
- `_treasure_shared.py` → `_character/treasures/_treasure_shared.py`
- `_treasure_finder.py` → `_character/treasures/_treasure_finder.py`

Concrete example (`_faction_shared.py`, verified against its current content — re-check before editing):

- `from ...models import Game` → `from .....models import Game`
- `from ...serializers import CharacterFactionSerializer, GameFactionListSerializer` → `from .....serializers import CharacterFactionSerializer, GameFactionListSerializer`
- `from ..common import check_game_edit` → `from ....common import check_game_edit`
- `from ._character_shared import _build_api_view, _check_character_all_permission` → `from .. import _build_api_view, _check_character_all_permission`
- `from .factions._faction_exchange import (...)` → `from ...factions._faction_exchange import (...)`
- `from .factions._factions import character_faction_detail, character_factions` → `from ...factions._factions import character_faction_detail, character_factions`

`_treasure_finder.py` only has `from ...models import GameTreasure, Treasure` → `from .....models import GameTreasure, Treasure`.

Apply the same category-based rule to `_document_shared.py`, `_item_shared.py`, `_photo_shared.py`, `_possession_shared.py`, `_treasure_shared.py` — each has the same three import categories (outside-`_character` refs, `_character_shared`/`_shared` refs, unmoved-sibling-folder refs), just re-verify each file's actual current import block before editing since names/lines differ per resource.

## Files to Change

- `backend/games/views/game/_document_shared.py` — move + fix imports
- `backend/games/views/game/_faction_shared.py` — move + fix imports
- `backend/games/views/game/_item_shared.py` — move + fix imports
- `backend/games/views/game/_photo_shared.py` — move + fix imports
- `backend/games/views/game/_possession_shared.py` — move + fix imports
- `backend/games/views/game/_treasure_shared.py` — move + fix imports
- `backend/games/views/game/_treasure_finder.py` — move + fix imports

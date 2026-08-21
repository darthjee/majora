# Move the 5 character-wide helpers and merge _character_shared.py into __init__.py

Move these 6 files from `backend/games/views/game/` into `backend/games/views/game/_character/`. Each moves exactly one package level deeper than today, so: any import reaching *outside* `_character/` gains exactly one leading dot; imports of siblings that move alongside them into `_character/` (`_shared`, `_decorators`, `_detail`, `_full`, `_regular`) keep their current dot count, since they stay siblings of each other.

- `_shared.py` → `_character/_shared.py`
- `_decorators.py` → `_character/_decorators.py`
- `_detail.py` → `_character/_detail.py`
- `_full.py` → `_character/_full.py`
- `_regular.py` → `_character/_regular.py`
- `_character_shared.py` → `_character/__init__.py` (content becomes the package's `__init__.py` directly — no separate `_shared_hub.py`)

Concrete import fixes (verified against the files' current content — re-check before editing in case they've changed since this plan was written):

- `_character_shared.py` → `_character/__init__.py`:
  - `from ...models import Game` → `from ....models import Game`
  - `from ..common import access_response, check_game_edit` → `from ...common import access_response, check_game_edit`
  - `from ._full import character_full` and `from ._shared import _find_character, _get_character_or_404` — unchanged (still siblings within `_character/`)
- `_shared.py`: `from ...models import Character` → `from ....models import Character`; `from ..common import hidden_gate_response` → `from ...common import hidden_gate_response`
- `_decorators.py`: `from ._shared import _get_character_or_404, _hidden_gate_response` — unchanged
- `_detail.py`: `from ...serializers import CharacterDetailSerializer` → `from ....serializers import CharacterDetailSerializer`; `from ._decorators import check_hidden` — unchanged
- `_full.py`: `from ...serializers import CharacterFullSerializer, CharacterUpdateSerializer` → `from ....serializers import CharacterFullSerializer, CharacterUpdateSerializer`; `from ..common import detail_or_update` → `from ...common import detail_or_update`; `from ._shared import _character_resource, _get_character_or_404` — unchanged
- `_regular.py`: `from ...serializers import CharacterDetailSerializer, CharacterRegularUpdateSerializer` → `from ....serializers import CharacterDetailSerializer, CharacterRegularUpdateSerializer`; `from ..common import detail_or_update` → `from ...common import detail_or_update`

## Files to Change

- `backend/games/views/game/_shared.py` — move + fix imports
- `backend/games/views/game/_decorators.py` — move + fix imports
- `backend/games/views/game/_detail.py` — move + fix imports
- `backend/games/views/game/_full.py` — move + fix imports
- `backend/games/views/game/_regular.py` — move + fix imports
- `backend/games/views/game/_character_shared.py` — move to `_character/__init__.py` + fix imports

# Update npcs/__init__.py and pcs/__init__.py re-export paths

In each of the two package re-export files, update the 6 moved symbols' import lines from
`from .detail.possessions.<module> import <name>` to
`from .detail.possessions.detail.<module> import <name>`. The 4 collection symbols' import
lines (`game_npc_possessions`, `game_npc_possessions_all`, `game_npc_possessions_available`,
`game_npc_possessions_available_all`, and `game_pc_*` mirrors) are untouched — they still
import from `.detail.possessions.<module>` since those files didn't move. The `__all__` list
in both files is unchanged — same exported names, only their source path changes.

`backend/games/views/game/npcs/__init__.py`, lines to update:

```python
from .detail.possessions.detail.game_npc_possession_acquire import game_npc_possession_acquire
from .detail.possessions.detail.game_npc_possession_acquire_all import game_npc_possession_acquire_all
from .detail.possessions.detail.game_npc_possession_detail import game_npc_possession_detail
from .detail.possessions.detail.game_npc_possession_detail_full import game_npc_possession_detail_full
from .detail.possessions.detail.game_npc_possession_remove import game_npc_possession_remove
from .detail.possessions.detail.game_npc_possession_remove_all import game_npc_possession_remove_all
```

Same 6 lines, `game_pc_*` names, in `backend/games/views/game/pcs/__init__.py`.

Watch line length / import-sort tooling (isort/flake8 line length) on the longer resulting
lines — wrap with parentheses the same way the existing
`game_npc_possessions_available_all` import already does, if a line exceeds the project's
configured limit.

## Files to Change

- `backend/games/views/game/npcs/__init__.py` — retarget the 6 moved symbols' import paths to `.detail.possessions.detail.<module>`
- `backend/games/views/game/pcs/__init__.py` — retarget the 6 moved symbols' import paths to `.detail.possessions.detail.<module>`

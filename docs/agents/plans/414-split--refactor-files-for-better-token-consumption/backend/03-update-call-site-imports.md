# Update call-site imports

Update every wrapper view file that currently imports a `build_*` factory directly from `_character_shared` to import it from the correct new domain module instead (`_photo_shared`, `_item_shared`, `_document_shared`, `_faction_shared`, `_possession_shared`, or `_treasure_shared`, per Step 1's placement), or leave it importing `_build_api_view`/`_check_character_all_permission`/`build_access_view`/`build_full_view` from `_character_shared.py` unchanged if that's what it actually uses. `_character_shared.py` does not re-export the moved names, so a missed file will fail to import (surfaced immediately by the test suite in Step 4, not silently).

## Files to Change

- `backend/games/views/game/pcs/detail/**/*.py` and `backend/games/views/game/npcs/detail/**/*.py` — all files matching `grep -rl "_character_shared import" backend/games/views/game/pcs backend/games/views/game/npcs` (118 files at plan time); update each file's import line to point at the module the imported name now lives in per Step 1.

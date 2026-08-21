# Create the _character package skeleton

Create the new `backend/games/views/game/_character/` package and its per-resource subfolders, empty for now — later steps populate them by moving existing files in.

## Files to Change

- `backend/games/views/game/_character/documents/__init__.py` — new, empty package marker
- `backend/games/views/game/_character/factions/__init__.py` — new, empty package marker
- `backend/games/views/game/_character/items/__init__.py` — new, empty package marker
- `backend/games/views/game/_character/photos/__init__.py` — new, empty package marker
- `backend/games/views/game/_character/possessions/__init__.py` — new, empty package marker
- `backend/games/views/game/_character/treasures/__init__.py` — new, empty package marker

`backend/games/views/game/_character/__init__.py` is not created empty here — Step 2 writes it directly from `_character_shared.py`'s content.

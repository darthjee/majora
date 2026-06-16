# Backend Plan: Split Django Views

Main plan: [plan.md](plan.md)

## Tasks

1. Create `source/games/views/` directory
2. Create `source/games/views/games.py` with `games_list` and `game_detail` views (moved from `views.py`)
3. Create `source/games/views/characters.py` with `game_pcs`, `game_npcs`, and `character_detail` views (moved from `views.py`)
4. Create `source/games/views/__init__.py` that imports and re-exports all view functions:
   - `from .games import games_list, game_detail`
   - `from .characters import game_pcs, game_npcs, character_detail`
5. Delete `source/games/views.py`
6. Run tests to confirm all views remain accessible and all tests pass

## Files

| File | Change |
|------|--------|
| `source/games/views.py` | Delete — replaced by the package below |
| `source/games/views/__init__.py` | New — re-exports all view functions |
| `source/games/views/games.py` | New — `games_list`, `game_detail` |
| `source/games/views/characters.py` | New — `game_pcs`, `game_npcs`, `character_detail` |

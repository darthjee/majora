# Move NPC and PC member-action view files into possessions/detail/

For both `backend/games/views/game/npcs/detail/possessions/` and
`backend/games/views/game/pcs/detail/possessions/` (mirror, `game_pc_*` filenames):

1. Create the new `possessions/detail/` subfolder with a docstring-only `__init__.py`,
   matching the sibling `detail/__init__.py` pattern one level up (e.g.
   `"""Member-action views for a single NPC's possession."""` / `"""Member-action views for a
   single PC's possession."""`) — not a re-export file.
2. Move these 6 member-action view files into it, filenames unchanged. The 4 collection
   files (`game_npc_possessions.py`, `game_npc_possessions_all.py`,
   `game_npc_possessions_available.py`, `game_npc_possessions_available_all.py`, and their
   `game_pc_*` mirrors) stay in `possessions/` — do not touch them.
3. In every moved file, bump the relative import of `_possession_shared` from
   `from ...._possession_shared import ...` (4 dots) to
   `from ....._possession_shared import ...` (5 dots) — the file gained one extra folder
   level (`detail/`) between it and `backend/games/views/game/_possession_shared.py`.
4. `game_npc_possession_detail_full.py` / `game_pc_possession_detail_full.py` additionally
   import `CharacterPossessionAllSerializer` via
   `from ......serializers import CharacterPossessionAllSerializer` (6 dots). Bump this one
   too, to `from .......serializers import CharacterPossessionAllSerializer` (7 dots) — same
   reason, one extra folder level. This is the only moved file with a second import to fix;
   the other 5 only have the `_possession_shared` import.

## Files to Change

- `backend/games/views/game/npcs/detail/possessions/detail/__init__.py` — new, docstring only
- `backend/games/views/game/npcs/detail/possessions/detail/game_npc_possession_detail.py` — moved, bump `_possession_shared` import to 5 dots
- `backend/games/views/game/npcs/detail/possessions/detail/game_npc_possession_detail_full.py` — moved, bump both imports (5 and 7 dots)
- `backend/games/views/game/npcs/detail/possessions/detail/game_npc_possession_acquire.py` — moved, bump `_possession_shared` import to 5 dots
- `backend/games/views/game/npcs/detail/possessions/detail/game_npc_possession_acquire_all.py` — moved, bump `_possession_shared` import to 5 dots
- `backend/games/views/game/npcs/detail/possessions/detail/game_npc_possession_remove.py` — moved, bump `_possession_shared` import to 5 dots
- `backend/games/views/game/npcs/detail/possessions/detail/game_npc_possession_remove_all.py` — moved, bump `_possession_shared` import to 5 dots
- `backend/games/views/game/pcs/detail/possessions/detail/__init__.py` — new, docstring only
- `backend/games/views/game/pcs/detail/possessions/detail/game_pc_possession_detail.py` — moved, bump `_possession_shared` import to 5 dots
- `backend/games/views/game/pcs/detail/possessions/detail/game_pc_possession_detail_full.py` — moved, bump both imports (5 and 7 dots)
- `backend/games/views/game/pcs/detail/possessions/detail/game_pc_possession_acquire.py` — moved, bump `_possession_shared` import to 5 dots
- `backend/games/views/game/pcs/detail/possessions/detail/game_pc_possession_acquire_all.py` — moved, bump `_possession_shared` import to 5 dots
- `backend/games/views/game/pcs/detail/possessions/detail/game_pc_possession_remove.py` — moved, bump `_possession_shared` import to 5 dots
- `backend/games/views/game/pcs/detail/possessions/detail/game_pc_possession_remove_all.py` — moved, bump `_possession_shared` import to 5 dots

# Move mirrored test files into possessions/detail/

Move each of the 12 test files mirroring the view files moved in step 01 into the matching
`detail/` subfolder under
`backend/games/tests/views/game/{npcs,pcs}/detail/possessions/`. Same filename with the
`_test.py` suffix, no `__init__.py` needed (the existing `possessions/` test folder has none
either). These test files only use absolute imports (`from games...`) — no import changes are
needed, this is a pure file move.

## Files to Change

- `backend/games/tests/views/game/npcs/detail/possessions/detail/game_npc_possession_detail_test.py` — moved, no changes
- `backend/games/tests/views/game/npcs/detail/possessions/detail/game_npc_possession_detail_full_test.py` — moved, no changes
- `backend/games/tests/views/game/npcs/detail/possessions/detail/game_npc_possession_acquire_test.py` — moved, no changes
- `backend/games/tests/views/game/npcs/detail/possessions/detail/game_npc_possession_acquire_all_test.py` — moved, no changes
- `backend/games/tests/views/game/npcs/detail/possessions/detail/game_npc_possession_remove_test.py` — moved, no changes
- `backend/games/tests/views/game/npcs/detail/possessions/detail/game_npc_possession_remove_all_test.py` — moved, no changes
- `backend/games/tests/views/game/pcs/detail/possessions/detail/game_pc_possession_detail_test.py` — moved, no changes
- `backend/games/tests/views/game/pcs/detail/possessions/detail/game_pc_possession_detail_full_test.py` — moved, no changes
- `backend/games/tests/views/game/pcs/detail/possessions/detail/game_pc_possession_acquire_test.py` — moved, no changes
- `backend/games/tests/views/game/pcs/detail/possessions/detail/game_pc_possession_acquire_all_test.py` — moved, no changes
- `backend/games/tests/views/game/pcs/detail/possessions/detail/game_pc_possession_remove_test.py` — moved, no changes
- `backend/games/tests/views/game/pcs/detail/possessions/detail/game_pc_possession_remove_all_test.py` — moved, no changes

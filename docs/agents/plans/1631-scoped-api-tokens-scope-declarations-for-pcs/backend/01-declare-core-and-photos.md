# Declare PC core and photo views
Add `@token_scopes` to `game_pcs`, `game_pc_detail` (decorator form, top of the stack) and wrap the
factory-built `game_pc_full`, `game_pc_access`, `game_pc_photos`, `game_pc_photo_upload`,
`game_pc_photo_set`, `game_pc_photo_detail` and `game_pc_photo_deletable` with
`token_scopes(...)(build_…(npc=False))`. Use the declarations in [backend.md](../backend.md#declaration-table).

## Files to Change
- `backend/games/views/game/pcs/game_pcs.py` — `@token_scopes(GET=[])`.
- `backend/games/views/game/pcs/game_pc_detail.py` — `@token_scopes(GET=[], PATCH=['pcs:write'])`.
- `backend/games/views/game/pcs/detail/game_pc_full.py`, `game_pc_access.py`, `game_pc_photo_upload.py` — wrap the factory call.
- `backend/games/views/game/pcs/detail/photos/game_pc_photos.py` and `photos/detail/*.py` — wrap the factory call.

# Declare scopes on NPC-only views

These views have no PC counterpart:

| View | Route name | Declaration | Why |
|---|---|---|---|
| `npcs/game_npcs_all.py` | `game-npcs-all` | `GET=['npcs:read']` | lists hidden NPCs (DM/superuser) |
| `npcs/game_npcs_full.py` | `game-npcs-full` | `POST=['npcs:write']` | creates an NPC with the full field set (DM/admin) |
| `npcs/detail/photos/game_npc_photos_all.py` | `game-npc-photos-all` | `GET=['npcs:read']` | photos of a hidden NPC (NPC editors) |
| `npcs/detail/treasures/game_npc_treasures_all.py` | `game-npc-treasures-all` | `GET=['npcs:read', 'treasures:read']` | includes hidden treasures |

`npcs/_npc_player_update.py` is a helper, not a routed view, so it needs no declaration.

## Files to Change
- `backend/games/views/game/npcs/game_npcs_all.py`
- `backend/games/views/game/npcs/game_npcs_full.py`
- `backend/games/views/game/npcs/detail/photos/game_npc_photos_all.py`
- `backend/games/views/game/npcs/detail/treasures/game_npc_treasures_all.py`

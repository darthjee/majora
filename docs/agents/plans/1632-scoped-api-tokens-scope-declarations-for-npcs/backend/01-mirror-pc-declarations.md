# Declare scopes on NPC views that mirror PC views

For each NPC view whose PC counterpart (same path with `pc` → `npc`) was declared in #1631, add the same `@token_scopes` declaration, with `pcs:read`/`pcs:write` replaced by `npcs:read`/`npcs:write`. Keep the other family scopes unchanged.

Patterns (from #1631):

| View kind | Declaration |
|---|---|
| plain list/detail/summary/available (`game_npcs`, `*_detail`, `*_summary`, `*_documents`, `*_files`, `*_photos`, …) | `GET=[]` |
| `*_all`, `*_detail_full`, `*_summary_all`, `*_available_all` for family X | `GET=['npcs:read', 'X:read']` |
| `game_npc_full` | `GET=['npcs:read'], PATCH=['npcs:write']` |
| `game_npc_access` | `GET=[]` |
| `*_acquire`, `*_remove`, `treasure_buy`, `treasure_sell` | `POST=['npcs:write']` |
| `*_acquire_all`, `*_remove_all`, `treasure_buy_all` for family X | `POST=['npcs:write', 'X:read']` |
| `game_npc_items` | `GET=[], POST=['npcs:write', 'items:write']` |
| `game_npc_possessions` | `GET=[], POST=['npcs:write', 'possessions:write']` |
| `game_npc_item_photo_upload` | `POST=['npcs:write', 'items:write']` |
| `game_npc_item_detail` / `game_npc_recipe_detail` | `GET=[], PATCH=['npcs:write', 'items:read' / 'recipes:read']` |
| `game_npc_recipes_available` | `GET=['npcs:read', 'recipes:read']` |
| `game_npc_photo_upload`, `game_npc_photo_set` | `POST`/`PATCH=['npcs:write']` |
| `game_npc_photo_detail` | `PATCH=['npcs:write'], DELETE=['npcs:write']` |
| `game_npc_photo_deletable` | `GET=['npcs:read']` |

Methods differ in one known place: `game_npc_detail` serves `GET` and `PATCH`. The `PATCH` applies the narrow, player-facing NPC update (`_npc_player_update.py`), so declare `GET=[], PATCH=['npcs:write']`. Also, `game_npcs` serves `POST` (NPC creation), which `game_pcs` does not, so declare `GET=[], POST=['npcs:write']`. Check every file's `@api_view` methods against its PC counterpart.

## Files to Change
- `backend/games/views/game/npcs/game_npcs.py`, `game_npc_detail.py` — core declarations.
- `backend/games/views/game/npcs/detail/**/*.py` — every nested view with a PC counterpart (documents, files, document photos, factions, items, possessions, recipes, treasures, photos, access, full, photo upload, and the reverse-nested `*_summary` / `*_summary_all` views).

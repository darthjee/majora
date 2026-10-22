# Add end-to-end token scope tests
Add two test modules modelled on `game_documents_token_scopes_test.py`, using `ScopedTokenMixin` (`games/tests/views/game/_scoped_token_fixtures.py`).

Factions (a game with a DM and a player, a faction with a visible and a hidden PC and NPC):
- public reads (`factions.json`, `factions/<id>.json`, `factions/<id>/characters.json`, `permissions/game_faction.json`) answer 200 for a token with no scopes;
- `characters/all.json` as DM: 200 with all three read scopes (hidden characters included); 403 `scope_missing` when `factions:read`, `pcs:read` or `npcs:read` is missing;
- writes (`POST factions.json`, `PATCH factions/<id>.json`, `POST photo_upload.json`): 403 `scope_missing` without `factions:write`, success with it;
- 403 `game_not_allowed` for a token whose game list holds only the other game;
- owner-role intersection: a player's token with every faction scope still gets the normal 403 on `PATCH` and `characters/all.json`.

Tasks:
- `GET tasks.json` / `tasks/<id>.json` as DM: 403 `scope_missing` without `tasks:read`, 200 with it;
- `POST tasks.json` / `PATCH tasks/<id>.json` (including setting `session`): 403 without `tasks:write`, success with it, no `sessions:*` scope needed;
- 403 `game_not_allowed` for a wrong game;
- owner-role intersection: a player's token with `tasks:read`/`tasks:write` still gets 403.

## Files to Change
- `backend/games/tests/views/games/game_factions_token_scopes_test.py` — new
- `backend/games/tests/views/game_tasks/game_tasks_token_scopes_test.py` — new

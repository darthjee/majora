# Declare scopes on faction and task views
Add the `@token_scopes(...)` declarations from the table in [backend.md](../backend.md) to each view, importing `token_scopes` from `...decorators` as the document views do. Then remove the eight URL names (`game-factions`, `game-faction-detail`, `game-faction-photo-upload`, `game-faction-characters`, `game-faction-characters-all`, `permissions-game-faction`, `game-tasks-list`, `game-task-detail`) from `PENDING_TOKEN_SCOPES`. Behaviour for sessions and legacy tokens must not change.

## Files to Change
- `backend/games/views/games/game_factions.py` — `GET=[]`, `POST=['factions:write']`
- `backend/games/views/games/game_faction_detail.py` — `GET=[]`, `PATCH=['factions:write']`
- `backend/games/views/games/game_faction_photo_upload.py` — `POST=['factions:write']`
- `backend/games/views/games/game_faction_characters.py` — `GET=[]`
- `backend/games/views/games/game_faction_characters_all.py` — `GET=['factions:read', 'pcs:read', 'npcs:read']`
- `backend/games/views/permissions/game_faction_permissions.py` — `GET=[]`
- `backend/games/views/game_tasks/game_tasks_list.py` — `GET=['tasks:read']`, `POST=['tasks:write']`
- `backend/games/views/game_tasks/game_task_detail.py` — `GET=['tasks:read']`, `PATCH=['tasks:write']`
- `backend/accounts/tests/token_scopes_coverage_test.py` — remove the eight names from `PENDING_TOKEN_SCOPES`

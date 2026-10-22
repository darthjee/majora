# Declare scopes on game-scoped treasure views
Add `@token_scopes(...)` (from `games.decorators`) above `@api_view` on each game-scoped treasure view. The game list is enforced automatically through `game_slug`.

| View | Declaration |
|---|---|
| `game_treasures` | `GET=[]`, `POST=['treasures:write']` |
| `game_treasures_all` | `GET=['treasures:read']` |
| `game_treasures_missing` | `GET=['treasures:read']` |
| `game_treasure_link` | `POST=['treasures:write']` (the linked catalogue treasure is the same family, and catalogue treasures have no hidden flag) |
| `game_treasure_detail` | `GET=[]`, `PATCH=['treasures:write']` |
| `game_treasure_full` | `GET=['treasures:read']` |

## Files to Change
- `backend/games/views/games/game_treasures.py` — add declaration.
- `backend/games/views/games/game_treasures_all.py` — add declaration.
- `backend/games/views/games/game_treasures_missing.py` — add declaration.
- `backend/games/views/games/game_treasure_link.py` — add declaration.
- `backend/games/views/games/game_treasure_detail.py` — add declaration.
- `backend/games/views/games/game_treasure_full.py` — add declaration.

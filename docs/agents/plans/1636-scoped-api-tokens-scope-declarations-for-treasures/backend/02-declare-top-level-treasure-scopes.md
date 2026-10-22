# Declare scopes on top-level treasure and permission views
Add `@token_scopes(...)` to the top-level catalogue views and the two treasure permission reports. These routes have no `game_slug`, so `TokenScopeCheck` applies scopes only.

| View | Declaration |
|---|---|
| `treasures_list` | `GET=[]`, `POST=['treasures:write']` |
| `treasure_detail` | `GET=[]`, `PATCH=['treasures:write']` |
| `treasure_access` | `GET=[]` |
| `treasure_photo_upload` | `POST=['treasures:write']` |
| `treasure_permissions` | `GET=[]` |
| `game_treasure_permissions` | `GET=[]` |

**In-view game-list check.** `treasure_detail` `PATCH` and `treasure_photo_upload` `POST` can target a game-exclusive treasure (`treasure.game_id` set). When the request is authenticated by a scoped `ApiToken` with a non-empty game list and `treasure.game_id` is not on it, refuse with 403 `game_not_allowed`, either by raising `accounts.authentication.GameNotAllowed` or by building the same `{"errors": {"detail": ["game_not_allowed"]}}` body. Run this check after the treasure lookup and before the role check. Reuse or extract the token-games lookup pattern from `my_games_list._token_game_ids` (e.g. a small shared helper in `backend/accounts/`) rather than duplicating it. Catalogue treasures (`game_id` null) and session/legacy-token requests are unaffected.

## Files to Change
- `backend/games/views/treasures/treasures_list.py` — add declaration.
- `backend/games/views/treasures/treasure_detail.py` — add declaration and the in-view game-list check on `PATCH`.
- `backend/games/views/treasures/treasure_access.py` — add declaration.
- `backend/games/views/treasures/treasure_photo_upload.py` — add declaration and the in-view game-list check.
- `backend/games/views/permissions/treasure_permissions.py` — add declaration.
- `backend/games/views/permissions/game_treasure_permissions.py` — add declaration.
- `backend/accounts/` (e.g. a token-games helper module) — optional shared helper for the in-view check; update `my_games_list.py` to use it if it is extracted.

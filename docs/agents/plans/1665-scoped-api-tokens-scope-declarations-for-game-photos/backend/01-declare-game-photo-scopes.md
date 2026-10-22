# Declare scopes on the game photo views

Import `token_scopes` from `games.decorators` and put it **above** `@api_view` on both views, the
same way other views do (e.g. `backend/games/views/game/pcs/detail/game_pc_photo_upload.py`):

- `game_photos`: `@token_scopes(GET=[])`. It stays `AllowAny` and keeps listing only ready photos.
- `photo_upload`: `@token_scopes(POST=['games:write'])`. Keep `IsAuthenticated` and the
  `check_game_edit` role check as they are.

## Files to Change
- `backend/games/views/games/game_photos.py` — add `@token_scopes(GET=[])`.
- `backend/games/views/photo_upload.py` — add `@token_scopes(POST=['games:write'])`.

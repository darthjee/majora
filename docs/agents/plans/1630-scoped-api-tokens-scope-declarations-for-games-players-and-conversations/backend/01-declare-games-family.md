# Declare the games family and filter my-games

Add the declarations to the `games` family views:

- `games_list`: `@token_scopes(GET=[], POST=['games:write'])`. `games.json` stays unfiltered.
- `my_games_list`: `@token_scopes(GET=['games:read'])`.
- `game_detail`: `@token_scopes(GET=[], PATCH=['games:write'])`.
- `game_access`: `@token_scopes(GET=[])`.
- `game_permissions`: `@token_scopes(GET=[])`.

Filter `my-games.json`: when `request.auth` is an `ApiToken` whose `games` list is not empty, restrict the result to those games. The cleanest way is an optional `game_ids` (or queryset) argument to `MyGamesBuilder`, applied in `_players()` so the conversation counts are only computed for those games. Keep the view thin and match the existing helper style. An empty list means every game.

Remove `games-list`, `my-games-list`, `game-detail`, `game-access` and `permissions-game` from `PENDING_TOKEN_SCOPES`.

## Files to Change

- `backend/games/views/games/games_list.py` — add the declaration.
- `backend/games/views/games/my_games_list.py` — add the declaration and pass the token's games to the builder.
- `backend/games/serializers/games/my_games/_my_games_builder.py` — optional game restriction.
- `backend/games/views/games/game_detail.py` — add the declaration.
- `backend/games/views/games/game_access.py` — add the declaration.
- `backend/games/views/permissions/game_permissions.py` — add the declaration.
- `backend/accounts/tests/token_scopes_coverage_test.py` — remove the five names.

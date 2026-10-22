# Declare players and conversations

- `game_players`: `@token_scopes(GET=['players:read'])`.
- `game_player_detail`: `@token_scopes(GET=['players:read'])`.
- `game_conversations`: `@token_scopes(GET=['conversations:read', 'players:read'])`. It is gated on the player `show` permission and takes a `player_id` whose 404s reveal whether a player exists, so it also needs `players:read`.

Remove `game-players`, `game-player-detail` and `game-conversations` from `PENDING_TOKEN_SCOPES`.

## Files to Change
- `backend/games/views/game/players/game_players.py` — add the declaration.
- `backend/games/views/game/players/game_player_detail.py` — add the declaration.
- `backend/games/views/game/conversations/game_conversations.py` — add the declaration.
- `backend/accounts/tests/token_scopes_coverage_test.py` — remove the three names.

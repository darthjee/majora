# End-to-end token scope tests

Add tests in the style of `game_factions_token_scopes_test.py`, using `ScopedTokenMixin`:

- **Games** (`games/tests/views/games/games_token_scopes_test.py`):
  - public reads with no scopes (`games.json`, `games/<slug>.json`, `access.json`, `permissions/game.json`);
  - `games.json` POST with and without `games:write`;
  - `games/<slug>.json` PATCH with and without `games:write`, a wrong game (`game_not_allowed`), and the owner-role intersection (a non-DM's token with `games:write` is refused by role, not by scope);
  - `my-games.json` without `games:read` (`scope_missing`), with an empty game list (every game), and with a one-game list (only that game).
- **Players** (`games/tests/views/game/players/game_players_token_scopes_test.py`): list and detail with and without `players:read`, a wrong game, and an outsider's token with `players:read` refused by role.
- **Conversations** (`games/tests/views/game/conversations/game_conversations_token_scopes_test.py`): allowed with both scopes, and `scope_missing` when either is missing (the read across families). Also a wrong game.
- At least one check that session and legacy `Token` callers still get the same `my-games.json` as before.

## Files to Change

- `backend/games/tests/views/games/games_token_scopes_test.py` — new.
- `backend/games/tests/views/game/players/game_players_token_scopes_test.py` — new.
- `backend/games/tests/views/game/conversations/game_conversations_token_scopes_test.py` — new.
- `backend/games/tests/...my_games_builder` test (if a builder test exists) — cover the new game restriction.

# Add scoped-token tests

Add test classes to `backend/games/tests/views/games/games_token_scopes_test.py`, reusing
`GamesScopedTokenMixin` (two games, a DM, a player, an outsider) and the `ScopedTokenMixin` helpers
(`_get`, `_post`, `_assert_refused`, `_assert_role_refused`):

- **Photo listing** (`/games/test-game/photos.json`):
  - a token with no scopes gets `200`;
  - a token limited to `other_game` gets `403 game_not_allowed`.
- **Photo upload** (`POST /games/test-game/photo_upload.json` with `{'filename': 'photo.jpg'}`):
  - the DM with `games:read` alone gets `403 scope_missing`;
  - the DM with `games:write` succeeds (assert the same success status as
    `backend/games/tests/views/photo_upload_test.py`);
  - the DM with `games:write` but limited to `other_game` gets `403 game_not_allowed`;
  - the outsider with `games:write` is refused by role (`_assert_role_refused`).
- **Other credentials**: the DM's session and legacy `Token` can still upload (extend
  `TestGamesTokenScopesOtherCredentials`).

Mention issue #1665 in the new classes' docstrings, the way the module references #1630.

## Files to Change
- `backend/games/tests/views/games/games_token_scopes_test.py` — new photo test classes and the
  extra session / legacy-token cases.

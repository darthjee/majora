# Add end-to-end token-scope tests

Add a test module mirroring `backend/games/tests/views/game/pcs/token_scopes_test.py`, reusing `ScopedTokenMixin` from `backend/games/tests/views/game/_scoped_token_fixtures.py`. Cover:

- a public read without scopes (`documents.json`, `documents/<id>.json`, `pages.json`);
- a restricted read: `documents/all.json` / `full.json` refused with `scope_missing` without `documents:read`, allowed for the DM with it;
- a write refused with `scope_missing` without `documents:write` (e.g. `documents.json` POST, `pages/<id>.json` PATCH), and allowed with it;
- an upload (`photo_upload.json` or `file_upload.json`) needing `documents:write`;
- a wrong game: a token limited to another game gets `game_not_allowed`;
- the owner-role intersection: a player's token with `documents:read` still cannot read `full.json` (role refusal, not `scope_missing`);
- session and legacy-token requests still behave as before.

## Files to Change
- `backend/games/tests/views/games/game_documents_token_scopes_test.py` — new.

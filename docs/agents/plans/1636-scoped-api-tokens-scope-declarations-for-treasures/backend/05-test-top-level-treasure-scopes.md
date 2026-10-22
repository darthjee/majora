# Test the top-level treasure and permission declarations
Add end-to-end tests for the top-level routes and the permission reports.

Cover:
- Public reads with a token without scopes: `treasures.json`, `treasures/<id>.json`, `treasures/<id>/access.json`, `permissions/treasure.json`, `permissions/game_treasure.json`.
- Writes: `treasures.json` `POST`, `treasures/<id>.json` `PATCH` and `treasures/<id>/photo_upload.json` `POST` give `scope_missing` without `treasures:write` and succeed for a superuser/staff owner with it.
- No game-list check on catalogue routes: a token limited to some game still reaches the catalogue `POST`/`PATCH`/photo upload of a treasure with no owning game.
- In-view game-list check: a token limited to `other-game` gets 403 `game_not_allowed` on `PATCH` and photo upload of a treasure exclusive to `test-game`, and succeeds when that game is on its list.
- Owner intersection: a regular user or DM holding `treasures:write` is still refused on `POST treasures.json` and the top-level `PATCH`.
- Session and legacy `Token` requests are unchanged.

## Files to Change
- `backend/games/tests/views/treasures/treasures_token_scopes_test.py` — new test module.
- `backend/games/tests/views/game/_scoped_token_fixtures.py` — add helpers only if needed (e.g. a superuser member helper).

# Test the game-scoped treasure declarations
Add end-to-end tests modelled on `backend/games/tests/views/games/game_items_token_scopes_test.py` and `_entity_token_scopes_behavior.py`, using `ScopedTokenMixin` (`backend/games/tests/views/game/_scoped_token_fixtures.py`). Treasures differ from the generic entity behaviour: hiddenness lives on `GameTreasure`, and copies are either game-exclusive (`TreasureFactory(game=...)`) or linked catalogue treasures (`GameTreasureFactory`). So write a dedicated module, or extend the shared behaviours only if that stays simple.

Cover:
- Public reads with a token without scopes: `treasures.json`, `treasures/<id>.json` (visible copy).
- Restricted reads: `all.json`, `missing.json`, `<id>/full.json` give 403 `scope_missing` without `treasures:read` and 200 for a DM with it.
- Writes: `treasures.json` `POST`, `<id>.json` `PATCH`, `link.json` `POST` give `scope_missing` without `treasures:write` and succeed for a DM with it.
- Wrong game: a token limited to `other-game` gets 403 `game_not_allowed`.
- Owner intersection: a player or outsider holding `treasures:read`/`treasures:write` still gets the existing role refusal (`_assert_role_refused`).
- Session and legacy `Token` requests are unchanged.

## Files to Change
- `backend/games/tests/views/games/game_treasures_token_scopes_test.py` — new test module.

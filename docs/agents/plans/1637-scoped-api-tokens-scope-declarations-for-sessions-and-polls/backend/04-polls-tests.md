# Add polls token-scope tests

Same pattern as step 03 (add a `_put` helper to `ScopedTokenMixin` if needed). Cover:

- polls list/detail/votes GET require `polls:read`;
- polls POST, votes PUT, close PATCH and `sessions/<id>/poll.json` POST require
  `polls:write`; `sessions/<id>/poll.json` succeeds with `polls:write` alone (no `sessions:*`);
- `game_not_allowed`;
- owner intersection: non-member with full scopes refused on polls GET; player with
  `polls:write` refused on close; DM with `polls:write` refused on votes PUT;
- session login and legacy `Token` unchanged.

## Files to Change

- `backend/games/tests/views/polls/polls_token_scopes_test.py` — new.
- `backend/games/tests/views/game/_scoped_token_fixtures.py` — optional `_put` helper.

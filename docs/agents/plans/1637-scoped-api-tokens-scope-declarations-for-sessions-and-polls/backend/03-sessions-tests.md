# Add sessions token-scope tests

Follow `backend/games/tests/views/game_tasks/game_tasks_token_scopes_test.py` and the
`ScopedTokenMixin` from `backend/games/tests/views/game/_scoped_token_fixtures.py`. Cover:

- public GETs with no scopes on list/past/future/unscheduled/detail;
- `scope_missing` on messages GET/POST, session POST and PATCH; success with the right scope;
- `game_not_allowed` with a token restricted to `other-game`;
- owner intersection: non-member with full scopes refused on messages GET and session PATCH;
  DM with `sessions:write` refused on messages POST (player-only);
- session login and legacy `Token` unchanged.

## Files to Change

- `backend/games/tests/views/game_sessions/game_sessions_token_scopes_test.py` — new.

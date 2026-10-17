# Amend token-api.md and scopes.md

Bring the backend spec in line with the reachable-game and `options.json` decisions, so #1604
implements what the UI expects.

- **Reachable game** (`### Reachable game`): redefine as the games where the owner is DM, a
  player or a PC owner, plus every game for superusers; plain staff count as members only.
  Explain why the old wording ("any game the owner's roles let them read") is replaced: game
  list/detail are `AllowAny`, so it would mean every game. Keep the "one helper/queryset" rule
  and extend it to the `options.json` games list.
- **Owner endpoints table:** add `GET account/api_tokens/options.json` — "Scope catalogue and
  reachable games for the create form".
- **Payloads:** add an `#### Options: GET account/api_tokens/options.json` subsection with the
  shape `{"scopes": [...], "games": [{"slug", "name"}], "all_games": bool}`: `scopes` is the
  catalogue constant (sorted), `games` is the reachable-games helper output sorted by name,
  `all_games` is `true` for superusers.
- **Access / session-only / caching:** state that `options.json` follows the same rules as the
  other owner endpoints (session-only, 401 without a session, 403 `token_not_allowed` for a
  scoped token, single private variant, `X-Skip-Cache: true`, no Navi entry).
- **Edge cases, "Staff and superusers":** change "The token UI (#1605) warns staff and
  superusers who leave the games list empty" to superusers only, driven by `all_games`.
- **Testing strategy:** add rows for `options.json` (catalogue content, games for a member,
  for a superuser with `all_games: true`, for plain staff as members only, access cases, the
  `X-Skip-Cache` header) and for reachable-game validation of a plain staff user.
- **Affected code:** add `options.json` to the new `backend/accounts/urls/api_tokens.py` /
  view list.
- **`scopes.md`, `### Enforcement mechanism`:** the "shared by the decorator, token creation and
  the token UI's list of options" bullet now links to the `options.json` payload in
  `token-api.md`.

## Files to Change

- `docs/agents/specs/client/token-api.md` — reachable-game definition, new endpoint row,
  payload, access, edge-case wording, tests, affected code.
- `docs/agents/specs/client/scopes.md` — one cross-reference to `options.json`.

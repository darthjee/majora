# Plan: Scoped API tokens: scope declarations for games, players and conversations

Issue: [1630-scoped-api-tokens-scope-declarations-for-games-players-and-conversations.md](../../issues/1630-scoped-api-tokens-scope-declarations-for-games-players-and-conversations.md)

## Overview

Add `@token_scopes` (from `games/decorators.py`, placed above `@api_view`) to the views of the `games`, `players` and `conversations` families. Remove their URL names from `PENDING_TOKEN_SCOPES`, filter `my-games.json` by the token's game list, add end-to-end tests, and update `docs/agents/access-control/token-scopes.md`.

## Context

- The #1603 core is in place: `ApiTokenAuthentication` runs `TokenScopeCheck` and returns `(owner, api_token)`, so `request.auth` is an `accounts.models.ApiToken` for scoped requests. The game-list check only applies to the `game_slug` URL kwarg.
- The pattern to follow is #1634 (factions/tasks): `games/views/games/game_factions.py` and `games/tests/views/games/game_factions_token_scopes_test.py`, with `ScopedTokenMixin` in `games/tests/views/game/_scoped_token_fixtures.py`.
- Decided scopes:

| View | URL name | Declaration |
|---|---|---|
| `games_list` | `games-list` | `GET=[]`, `POST=['games:write']` |
| `my_games_list` | `my-games-list` | `GET=['games:read']` + game-list filter |
| `game_detail` | `game-detail` | `GET=[]`, `PATCH=['games:write']` |
| `game_access` | `game-access` | `GET=[]` |
| `game_permissions` | `permissions-game` | `GET=[]` |
| `game_players` | `game-players` | `GET=['players:read']` |
| `game_player_detail` | `game-player-detail` | `GET=['players:read']` |
| `game_conversations` | `game-conversations` | `GET=['conversations:read', 'players:read']` |

- Out of scope: `game-photos` / `game-photo-upload` (#1665) and `permissions-game-pc|npc|document` (#1666). Leave them on the pending list.

## Steps

- [01 — Declare the games family and filter my-games](backend/01-declare-games-family.md)
- [02 — Declare players and conversations](backend/02-declare-players-and-conversations.md)
- [03 — End-to-end token scope tests](backend/03-token-scope-tests.md)
- [04 — Update token-scopes.md](backend/04-update-token-scopes-doc.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI jobs: `pytest_views_rest`, `pytest_all`, `checks`)
- docs: markdownlint (CI job: `markdownlint`)

## Notes

- `games.json` POST and `my-games.json` have no `game_slug`, so `TokenScopeCheck` applies no game list to them. With a game list, a created game is not reachable by that token afterwards. This is intended.
- Do not delete `PENDING_TOKEN_SCOPES`: #1636–#1639, #1665 and #1666 still use it.
- Session and legacy `Token` behaviour must not change. In particular, the `my-games` filter only applies when `request.auth` is an `ApiToken` with a non-empty game list.

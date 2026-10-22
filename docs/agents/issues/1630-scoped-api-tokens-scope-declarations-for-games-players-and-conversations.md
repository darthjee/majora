# Issue: Scoped API tokens: scope declarations for games, players and conversations

## Description

Sub-issue of #1603 (epic #1592). Declare `@token_scopes` on the views of the `games`, `players` and `conversations` families, and remove them from `PENDING_TOKEN_SCOPES` in `backend/accounts/tests/token_scopes_coverage_test.py`. Also filter `my-games.json` to the token's games when the token carries a game list (`games.json` stays unfiltered).

The rules are in [`docs/agents/access-control/token-scopes.md`](../access-control/token-scopes.md): public (`AllowAny`, plain) reads declare `GET=[]`; restricted reads need `read` on every family in the response; writes need `write` on the owning family plus `read` on any other family whose restricted data they touch.

#1616 and the #1603 core (catalogue, decorator, auth-class check, coverage test) have landed.

## Problem

These views are still on the pending list, so every scoped token gets `403 token_not_allowed` on them — including `my-games.json` and `games/<slug>.json`, which a client needs to discover and read its games.

## Expected Behavior

| Route (URL name) | Method | Scopes |
|---|---|---|
| `games.json` (`games-list`) | GET | `[]` (public, unfiltered) |
| `games.json` (`games-list`) | POST (create game) | `games:write` |
| `my-games.json` (`my-games-list`) | GET | `games:read`; filtered to the token's game list |
| `games/<slug>.json` (`game-detail`) | GET | `[]` |
| `games/<slug>.json` (`game-detail`) | PATCH | `games:write` |
| `games/<slug>/access.json` (`game-access`) | GET | `[]` |
| `permissions/game.json` (`permissions-game`) | GET | `[]` |
| `games/<slug>/players.json` (`game-players`) | GET | `players:read` |
| `games/<slug>/players/<id>.json` (`game-player-detail`) | GET | `players:read` |
| `games/<slug>/conversations.json` (`game-conversations`) | GET | `conversations:read`, `players:read` |

### Decisions

- **Creating a game** needs `games:write` from any scoped token, including one that has a game list. The new game is not on that list, so the token cannot reach it afterwards. The owner's role rules still apply.
- **`my-games.json`** needs `games:read` alone. It is the caller's own membership summary: the game, their role, their own PC and unread conversation counts (numbers, not content). It does not require `players:read`, `pcs:read` or `conversations:read`.
- **`conversations.json`** needs `conversations:read` **and** `players:read`. It is gated on the player `show` permission and takes a `player_id`, and its 404s reveal whether a player exists (the same reasoning as `acquire/all.json`).
- **Out of scope:** the game photo views are #1665, and `permissions/game_pc|game_npc|game_document.json` are #1666 (both sub-issues of #1603).

## Acceptance criteria

- Every view in this group declares its scopes and is removed from `PENDING_TOKEN_SCOPES`.
- Per-family tests cover: a missing scope (403 `scope_missing`), a wrong game (403 `game_not_allowed`, for game-scoped routes), a public read without scopes, a restricted multi-family read, and the owner-role intersection (a scope never lets a token exceed its owner).
- `my-games.json` with a token carrying a game list returns only those games; with an empty list it returns every game.
- Session and legacy-token behaviour does not change.
- `token-scopes.md` Status records these families as declared, and its Read scopes section records the `my-games.json` and `conversations.json` decisions above.
- If this is the last sub-issue of #1603 to land, delete `PENDING_TOKEN_SCOPES`.

## Solution

- Add `@token_scopes(...)` above `@api_view` on `games_list`, `my_games_list`, `game_detail`, `game_access`, `game_permissions`, `game_players`, `game_player_detail` and `game_conversations`.
- `my_games_list` has no `game_slug`, so the authentication class cannot apply the game list: filter `MyGamesBuilder` output in the view to the token's games when `request.auth` is a scoped token with a non-empty list.
- Add per-family scope tests next to the existing PC/NPC/document/faction ones.

## Benefits

Clients holding scoped tokens can list and read their games, players and conversations, and the pending list shrinks toward removal.

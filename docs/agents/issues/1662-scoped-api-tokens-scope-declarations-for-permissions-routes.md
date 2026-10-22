# Scoped API tokens: scope declarations for permissions routes

## Context

Sub-issue of #1603 (epic #1592). The per-resource permission routes in
`backend/games/urls/permissions.py` are still on the coverage test's `PENDING_TOKEN_SCOPES`
list, and no family sub-issue declares them. #1631–#1633 left `permissions/game_pc.json`,
`permissions/game_npc.json` and `permissions/game_document.json` pending; #1630 only covers
`permissions/game.json`, and #1634 covers `permissions/game_faction.json`.

Per [`token-scopes.md`](../access-control/token-scopes.md#read-scopes), `permissions/*.json`
endpoints are public reads that only report what the caller's role may do, so they need no
scope to be read.

## What needs to be done

**Backend:** declare `@token_scopes(GET=[])` on the remaining permission routes and remove them
from `PENDING_TOKEN_SCOPES`:

- `permissions-game-pc` (`permissions/game_pc.json`)
- `permissions-game-npc` (`permissions/game_npc.json`)
- `permissions-game-document`
- `permissions-game-item`
- `permissions-game-common-item`
- `permissions-game-possession`
- `permissions-game-recipe`
- `permissions-game-treasure`
- `permissions-treasure` (`permissions/treasure.json`, not game-scoped)

Add tests showing that a scoped token with no scopes can read each route, and that the response
still reflects the token owner's role (a token never reports more than its owner may do).

**Docs:** update the Status paragraph of `docs/agents/access-control/token-scopes.md`.

## Acceptance criteria

- [ ] Each listed route declares `GET=[]` and is removed from `PENDING_TOKEN_SCOPES`.
- [ ] Tests show that a scoped token with no scopes can read each route, and that the response
      still reflects the owner's role (a token never reports more than its owner may do).
- [ ] The Status paragraph of `docs/agents/access-control/token-scopes.md` is updated.
- [ ] Session and legacy-token behaviour does not change.

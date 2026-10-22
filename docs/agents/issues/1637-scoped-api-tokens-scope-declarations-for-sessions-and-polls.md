# Scoped API tokens: scope declarations for sessions and polls

## Context

Sub-issue of #1603 (epic #1592). Scoped API tokens require every API view to declare which
token scopes each HTTP method needs. The #1603 core (scope catalogue, `@token_scopes`
decorator, auth-class check, and a coverage test with a temporary pending list) is in place,
and sibling sub-issues have already declared scopes for other families (PCs, NPCs, documents,
factions, tasks, items, games, players, conversations). This issue covers the `sessions` and
`polls` families.

**Blocked by:** #1616 and the #1603 core (catalogue, decorator, auth-class check, coverage
test with a pending list).

## What needs to be done

Backend:

- Declare `@token_scopes` for every HTTP method served by the views in these route groups:
  - `games/<slug>/sessions…` (including session messages);
  - `games/<slug>/polls…`;
  - `sessions/<id>/poll.json` and poll votes.
- Follow the family table and the read/write/link rules in
  [`docs/agents/specs/client/scopes.md`](../specs/client/scopes.md):
  - public (`AllowAny`) reads: `GET=[]`;
  - restricted reads: `read` on every family present in the response;
  - writes: `write` on the owning family, plus `read` on any other family whose restricted
    data they touch.
- Remove these views from the coverage test's temporary pending list; if this is the last
  sub-issue of #1603 to land, delete the pending list entirely.
- Add per-family tests.

## Acceptance criteria

- [ ] Every view in this group declares its scopes and is removed from the coverage test's
      temporary pending list.
- [ ] Per-family tests cover: a missing scope (403 `scope_missing`), a wrong game (403
      `game_not_allowed`, for game-scoped routes), a public read without scopes, a restricted
      multi-family read, link writes where they apply, and the owner-role intersection (a
      scope never lets a token exceed its owner).
- [ ] Session and legacy-token behaviour does not change.
- [ ] If this is the last sub-issue of #1603 to land, the pending list is deleted.

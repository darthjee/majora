# Issue: Scoped API tokens: scope declarations for NPCs

## Description
Sub-issue of #1603 (epic #1592). Declare `@token_scopes` on the `npcs` family: `games/<slug>/npcs…`, every route nested under an NPC (documents, factions, items, possessions, recipes, treasures, photos), and the reverse-nested NPC summaries (`documents/<id>/npcs…`, `factions/<id>/npcs…`, `items/<id>/npcs…`, `treasures/<id>/npcs…` summary routes). This mirrors #1631, which did the same for PCs.

The rules come from [`docs/agents/access-control/token-scopes.md`](../access-control/token-scopes.md).

**Blocked by:** #1616 and the #1603 core. Both are merged.

## Problem
Every NPC view is still on the coverage test's temporary pending list, so it refuses every scoped token with 403 `token_not_allowed`. Because of that, an automation that generates or manages NPCs can't use the client (#1607 onward), even though `npcs:write` exists so it can work without touching PCs.

## Expected Behavior
Each NPC view declares scopes for every HTTP method it serves:

- **Public (`AllowAny`) reads:** `GET=[]`, e.g. `npcs.json`, `npcs/<id>.json`, plain nested lists and details.
- **Restricted reads:** `read` on every family in the response. Examples:
  - `npcs/all.json` and `npcs/full.json` (hidden NPCs) need `npcs:read`.
  - `npcs/<id>/documents/<doc>/full.json` needs `npcs:read` and `documents:read`.
  - Permission-gated `available` lists, like PC `recipes/available` in #1631, need the read scopes of the families they list.
- **Writes:** `npcs:write`. They also need:
  - `write` on any other family they create a record in. `npcs/<id>/items.json` `POST` and the per-item photo upload need `items:write`, and `possessions.json` `POST` needs `possessions:write`.
  - `read` on any other family whose restricted data they touch: `acquire/all.json`, `remove/all.json`, and `PATCH` on link rows that return the `full.json` shape.
  - `remove`, `sell` and `buy` are writes on `npcs`.
- **NPC photos** (list, detail, upload, set, deletable) follow `npcs`.
- **Game list:** for every route here, a slug outside the token's game list gets 403 `game_not_allowed`.
- **Unchanged:** session and legacy-token behaviour.

**Out of scope:**
- `permissions/game/npc.json` stays pending with the other `permissions/*` routes, as `permissions/game/pc.json` did in #1631.
- Upload finalize belongs to #1639.

## Solution
- Add `@token_scopes` to the NPC core, nested and summary views, and to the NPC photo views, following the PC declarations from #1631.
- Remove those views from the pending list in `backend/accounts/tests/token_scopes_coverage_test.py`. Delete the list only if this is the last sub-issue of #1603 to land.
- Add end-to-end token-scope tests for NPC views covering:
  - a missing scope (403 `scope_missing`);
  - a wrong game (403 `game_not_allowed`);
  - a public read without scopes;
  - a restricted multi-family read;
  - link writes (`acquire` vs `acquire/all`);
  - a cross-family create (`items:write`);
  - the owner-role intersection: a token can't exceed its owner, e.g. a player's token with `npcs:read` still can't read hidden NPCs.
- Update the **Status** paragraph of `docs/agents/access-control/token-scopes.md` to say NPCs are declared.
- Reviews: `security` and `data-access`.

## Benefits
NPC automations can run with least privilege (`npcs:*`, plus only the linked families they need), and the players' PCs stay out of their reach.

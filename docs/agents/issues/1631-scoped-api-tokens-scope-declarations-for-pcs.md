# Issue: Scoped API tokens: scope declarations for PCs

## Description
Sub-issue of #1603 (epic #1592). Declare `@token_scopes` on the `pcs` family: `games/<slug>/pcs.json`, every route nested under a PC (`games/<slug>/pcs/<id>/…`, built by `games/urls/_character_routes.py`), PC photos, and the reverse-nested PC summaries (`games/<slug>/{documents,factions,items,treasures}/<id>/pcs/<character_id>/summary.json` and `summary/all.json`, whose views live under `games/views/game/pcs/`). The rules are in [`docs/agents/access-control/token-scopes.md`](../access-control/token-scopes.md).

Blockers #1603 (core: catalogue, decorator, auth-class check, coverage test with `PENDING_TOKEN_SCOPES`) and #1616 are merged.

## Problem
Every PC view is still on `PENDING_TOKEN_SCOPES` in `backend/accounts/tests/token_scopes_coverage_test.py`, so it refuses every scoped token with 403 `token_not_allowed`. A client or automation cannot read or change PCs with a token.

## Expected Behavior
- Each PC view declares scopes for every HTTP method it serves:
  - public (`AllowAny`) reads: `GET=[]`;
  - restricted reads (`all.json`, `full.json` and other permission-gated reads): `pcs:read` plus `read` on every other family in the response (e.g. `pcs/<id>/items/<item>/full.json` needs `pcs:read` and `items:read`);
  - writes, including link routes (`acquire`, `remove`, `buy`, `sell`) and photo upload/set/delete: `pcs:write`, plus `read` on every other family whose restricted data they touch (e.g. `documents/acquire/all.json` needs `pcs:write` and `documents:read`).
- The PC summaries belong to this issue, not to the other family's sub-issue: plain `summary.json` declares `GET=[]`; `summary/all.json` declares `GET=['pcs:read', '<family>:read']`.
- `POST pcs/<id>/items/<item>/photo_upload.json` needs `pcs:write` **and** `items:write`: it creates a `GameItemPhoto`, and finalize (#1639) maps that model to `items:write`, so a token never starts an upload it cannot finish.
- Game-scoped requests whose `game_slug` is not on the token's game list get 403 `game_not_allowed`.
- A token never exceeds its owner's role: views still run their normal checks as the owner.
- Session and legacy-token behaviour does not change.

## Solution
- Add `@token_scopes` to every PC view, following the read/write/link rules in the spec.
- PC views are built by factories shared with NPCs (e.g. `build_item_detail_full_view(npc=False)`). Declare the scopes in each per-kind PC module, not in the shared factory: `game_pc_x = token_scopes(GET=[...])(build_x_view(npc=False))`. This keeps each declaration explicit and greppable, and #1632 mirrors it with `npcs` scopes.
- Remove those views from `PENDING_TOKEN_SCOPES`. If this is the last sub-issue of #1603 to land, delete the pending list.
- Per-family tests: missing scope (403 `scope_missing`), wrong game (403 `game_not_allowed`), a public read without scopes, a restricted multi-family read, link writes, and the owner-role intersection.
- Reviews: `security` and `data-access`.

## Benefits
Tokens can read and manage PCs with least privilege. An automation can hold `pcs:*` without touching NPCs, and a token never leaks another family's restricted data.

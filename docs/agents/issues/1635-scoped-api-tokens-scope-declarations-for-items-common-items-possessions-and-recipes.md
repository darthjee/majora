# Issue: Scoped API tokens: scope declarations for items, common items, possessions and recipes

## Description

Sub-issue of #1603 (epic #1592). Declare `@token_scopes` on every view of the inventory families `items`, `common_items`, `possessions` and `recipes` (`games/<slug>/items…`, `common_items…`, `possessions…`, `recipes…`) plus their `permissions/game_<family>.json` routes, and remove them from the coverage test's `PENDING_TOKEN_SCOPES`.

The rules live in [`docs/agents/access-control/token-scopes.md`](../access-control/token-scopes.md): public (`AllowAny`, hidden-excluding) reads declare `GET=[]`; restricted reads (`all.json`, `full.json`, other GameEdit reads) need `read` on every family in the response; writes need `write` on the owning family plus `read` on any other family whose restricted data they touch.

**Blocked by:** #1616 and the #1603 core (catalogue, decorator, auth-class check, coverage test with a pending list) — all merged. Follows the precedent set by #1631–#1634.

## Problem

These 27 views are still on the pending list, so every scoped token gets `403 token_not_allowed` on them (fail closed). Recipes are the one cross-family case: a recipe embeds its output `GameCommonItem`, which the plain routes mask when hidden but the restricted routes (and the GameEdit-tier write responses) expose unmasked; and `recipes/<id>/characters/all.json` lists hidden PCs/NPCs.

## Expected Behavior

| View (URL name) | Declaration |
|---|---|
| `game-items` | `GET=[]`, `POST=[items:write]` |
| `game-items-all` | `GET=[items:read]` |
| `game-item-detail` | `GET=[]`, `PATCH=[items:write]` |
| `game-item-detail-full` | `GET=[items:read]` |
| `game-item-photo-upload` | `POST=[items:write]` |
| `game-possessions` | `GET=[]`, `POST=[possessions:write]` |
| `game-possessions-all` | `GET=[possessions:read]` |
| `game-possession-detail` | `GET=[]`, `PATCH=[possessions:write]` |
| `game-possession-detail-full` | `GET=[possessions:read]` |
| `game-possession-photo-upload` | `POST=[possessions:write]` |
| `game-common-items` | `GET=[]`, `POST=[common_items:write]` |
| `game-common-items-all` | `GET=[common_items:read]` |
| `game-common-item-detail` | `GET=[]`, `PATCH=[common_items:write]` |
| `game-common-item-detail-full` | `GET=[common_items:read]` |
| `game-common-item-photo-upload` | `POST=[common_items:write]` |
| `game-common-item-recipes` | `GET=[]` |
| `game-common-item-recipes-all` | `GET=[common_items:read, recipes:read]` |
| `game-recipes` | `GET=[]`, `POST=[recipes:write, common_items:read]` |
| `game-recipes-all` | `GET=[recipes:read, common_items:read]` |
| `game-recipe-detail` | `GET=[]`, `PATCH=[recipes:write, common_items:read]` |
| `game-recipe-detail-full` | `GET=[recipes:read, common_items:read]` |
| `game-recipe-characters` | `GET=[]` |
| `game-recipe-characters-all` | `GET=[recipes:read, pcs:read, npcs:read]` (mirrors `factions/<id>/characters/all.json`) |
| `permissions-game-item`, `permissions-game-common-item`, `permissions-game-possession`, `permissions-game-recipe` | `GET=[]` |

Recipe writes need `common_items:read` because GameEdit-tier callers may set a hidden common item as the output (`allow_hidden_output`) and the response returns it unmasked.

The reverse-nested `items/<id>/pcs|npcs/<cid>/summary…` routes are already declared by #1631/#1632 and are out of scope, as is upload finalize (#1639).

## Solution

- Add `@token_scopes(...)` above `@api_view` on each view listed above and drop their names from `PENDING_TOKEN_SCOPES` in `backend/accounts/tests/token_scopes_coverage_test.py`. Other families remain pending, so the set is not deleted here.
- Add per-family token-scope tests (using the shared `_scoped_token_fixtures.py`) covering: a missing scope (`403 scope_missing`), a wrong game (`403 game_not_allowed`), a public read without scopes, a restricted multi-family read (recipes ↔ common items, recipe characters), and the owner-role intersection (a scope never lets a token exceed its owner, e.g. a player token with `items:read` still gets the owner's 403 on `items/all.json`).
- Session and legacy-token behaviour does not change.
- Update the **Status** paragraph of `docs/agents/access-control/token-scopes.md` to list these families as declared.

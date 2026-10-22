# Backend Plan: Scoped API tokens: scope declarations for items, common items, possessions and recipes

Main plan: [plan.md](plan.md)

## Overview

Add `@token_scopes(...)` (from `games/decorators.py`) **above** `@api_view` on every view in the
issue's declaration table, remove each URL name from `PENDING_TOKEN_SCOPES`, add one
token-scopes test module per family, and update the Status paragraph of
`docs/agents/access-control/token-scopes.md`. Follows the #1633/#1634 precedent
(`game_factions_token_scopes_test.py`, `game_tasks_token_scopes_test.py`).

## Context

- Plain `AllowAny` hidden-excluding reads declare `GET=[]`; `all.json` / `full.json` (GameEdit)
  reads need `<family>:read`; writes need `<family>:write`; photo upload inits need the owning
  family's `write`; `permissions/game_<family>.json` declare `GET=[]`.
- Recipes are cross-family (agreed in the issue): recipe `all`/`full` reads and recipe POST/PATCH
  add `common_items:read` (GameEdit callers may set a hidden output and the response unmasks it,
  see `_recipe_write.py` `allow_hidden_output`); `common_items/<id>/recipes/all.json` needs
  `common_items:read` + `recipes:read`; `recipes/<id>/characters/all.json` needs
  `recipes:read` + `pcs:read` + `npcs:read` (mirrors `game_faction_characters_all.py`).
- Scope strings are written in the issue table as `items:write` etc.; in code they are quoted
  strings in lists, e.g. `@token_scopes(GET=[], POST=['items:write'])`.

## Steps

- [01 — Items and possessions](backend/01-items-and-possessions.md)
- [02 — Common items](backend/02-common-items.md)
- [03 — Recipes](backend/03-recipes.md)
- [04 — Coverage list and docs](backend/04-coverage-and-docs.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (plus the backend lint job used by CI)

## Notes

- `items/<id>/pcs|npcs/<cid>/summary…` are already declared by #1631/#1632 — leave them alone.
- Upload finalize (`PATCH uploads/<type>/<id>.json`) stays pending (#1639).
- Other families remain pending, so `PENDING_TOKEN_SCOPES` is **not** deleted here.
- Never declare a method a view does not serve: the decorator raises `ValueError` at import.

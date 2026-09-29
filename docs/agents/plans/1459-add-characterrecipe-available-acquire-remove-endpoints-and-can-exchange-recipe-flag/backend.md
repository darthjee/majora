# Backend Plan: Add CharacterRecipe available/acquire/remove endpoints and can_exchange_recipe flag

Main plan: [plan.md](plan.md)

## Overview

Implement the "Available (acquire catalog)", "Acquire and remove" and "Permissions" sections of
`docs/agents/specs/recipes/api-contract.md` for PCs and NPCs. The contract is binding. Structure
follows `games/views/game/documents/_document_exchange.py` and
`games/views/game/_character/documents/_document_shared.py`, but with the recipe-specific
tiers, error order and masking rules below.

## Context

- #1447 (merged) added `CharacterRecipe`, `CharacterRecipe*Serializer` (context
  `mask_hidden_output`), `games/views/game/recipes/_character_recipes.py` and
  `games/views/game/_character/recipes/_recipe_shared.py`. That module already has
  `_check_restricted_access` (hidden-NPC gate first, then CharacterEdit/GameEdit),
  `_mask_hidden_output` and `_skip_cache`.
- `GameRecipeListSerializer` masks the output; `GameRecipeAllListSerializer` adds `hidden` and
  returns the real output. These are the available-list shapes.
- Tiers (PC / NPC):
  - `available`, `acquire`, `remove`: `regular.create` on `game_pc_recipe` / `game_npc_recipe`
    (staff, player) for both.
  - `available/all`, `acquire/all`: GameEdit (no owner leniency) for both.
  - `remove/all`: CharacterEdit for PCs, GameEdit for NPCs.
- Differences from documents to keep in mind:
  - Document `acquire`/`remove` use a `restricted` tier for `/all`. Recipes use
    GameEdit / `_check_character_all_permission` instead and have **no `restricted` block**.
  - Recipes return `400` for a cross-game `game_recipe_id` **before** the `404`.
  - Recipes have no `hidden` override in the body.
  - Recipe `available` is gated, so it is always `X-Skip-Cache: true`.
  - Acquire returns a recipe-specific success shape.
- **E7:** on NPC routes, the hidden-NPC gate runs before any permission check. This includes
  the `regular.create` check, so the gate must run first for the plain variants too.

## Steps

- [01 — Permission configs and can_exchange_recipe flag](backend/01-permissions-and-flag.md)
- [02 — Exchange implementation (available / acquire / remove)](backend/02-exchange-implementation.md)
- [03 — View builders, per-character views and routes](backend/03-views-and-routes.md)
- [04 — Tests](backend/04-tests.md)
- [05 — Access-control docs](backend/05-access-control-docs.md)

## CI Checks

- `backend`: `poetry run pytest --cov` and `poetry run ruff check .`, run through
  `docker-compose` / `make tests` (CI jobs: `pytest_views_characters`, `pytest_views_rest`,
  `pytest_all`, `checks`)

## Notes

- Out of scope: Navi (#1448) and frontend (#1450). `available.json` is gated and has no Navi
  resource.
- Accepted known limitation, from the contract: a recipe known only through a hidden
  `CharacterRecipe` is still left out of `available.json` and still returns `422` on acquire.
  Test the current behavior; do not "fix" it.
- `can_exchange_recipe` roles live in `ui.yml`, which duplicates `endpoints.yml`'s
  `regular.create` (same as the possession configs). Keep both lists identical and say so in a
  YAML comment.

# Backend Plan: Add GameRecipe create and edit endpoints

Main plan: [plan.md](plan.md)

## Overview

This plan adds the write API for `GameRecipe` (create and edit), the permission flags the frontend
needs, and the access-control documentation. #1445 already added the model, the read serializers
and the routes, so no migration and no new write URL are needed.

## Context

- Model: `backend/games/models/game/game_recipe.py`. It has no max validators, so the
  `2147483647` caps must live in the write serializer.
- Read serializers are in `backend/games/serializers/games/recipes/game_recipe_list.py`:
  - `GameRecipeDetailSerializer` is the plain shape. It has no `hidden` field and masks the
    output.
  - `GameRecipeDetailFullSerializer` is the `GameEdit` shape.
- Read views are in `backend/games/views/game/recipes/` (`game_recipes.py`,
  `game_recipe_detail.py`).
- The pattern to copy is GameCommonItem:
  - create: `backend/games/views/games/_common_item_create.py`
  - update: `backend/games/views/games/game_common_item_detail.py`
  - endpoint permissions: `backend/permissions/config/game_common_item/endpoints.yml`
- Tier check without a 403: `game.can_be_edited_by(request.user)`.
- `X-Skip-Cache` helper: `skip_cache` in `backend/games/decorators.py`.

## Steps

- [01 — Permission config](backend/01-permission-config.md)
- [02 — Write serializer](backend/02-write-serializer.md)
- [03 — Create and update views](backend/03-create-update-views.md)
- [04 — Recipe permissions endpoint](backend/04-recipe-permissions-endpoint.md)
- [05 — Tests](backend/05-tests.md)
- [06 — Access-control docs](backend/06-access-control-docs.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI jobs split this into
  `games/tests/views/game/`, the other `games/tests/views/`, and everything else)
- `backend`: `docker-compose run --rm majora_tests ruff check .` and
  `docker-compose run --rm majora_tests bin/reports.sh ci` (xenon complexity gate)
- docs: `docker-compose run --rm markdownlint`

## Notes

- The flag roles come from `config/<resource>/ui.yml`, not from `endpoints.yml`. Keep the
  `create_recipe` roles in `game/ui.yml` in sync with `game_recipe/endpoints.yml`
  `regular.create`. This is how `can_create_common_item` already works.
- `GET /permissions/game.json` is purely role-simulated. The "dual path" in the issue refers
  to `PermissionsBuilder` supporting both real and simulated identities. Nothing extra is needed.
- Do not use `get_object_or_404` inside the `skip_cache`-wrapped write helpers. `Http404` would
  drop the header, so return `Response(status=404)` explicitly instead.
- Out of scope: `CharacterRecipe`, Navi (#1448), frontend, delete, and photo upload.

# Backend Plan: Add GameRecipe model and read endpoints

Main plan: [plan.md](plan.md)

## Overview

Implement the `GameRecipe` model and its read API exactly as fixed by the recipes spec
(`docs/agents/specs/recipes.md` and `docs/agents/specs/recipes/*.md`, notably
`game-recipe.md`, `visibility.md` and `api-contract.md`). The spec is the source of truth. When
this plan and the spec disagree, follow the spec.

## Context

- Model on `GameCommonItem` (`backend/games/models/game/game_common_item.py`) and its views and
  serializers (`backend/games/views/games/game_common_item*.py`,
  `backend/games/serializers/games/common_items/game_common_item_list.py`).
- Restricted variants use `check_game_edit` (`backend/games/views/common.py`) and set
  `X-Skip-Cache: true`. Indexes use `paginated_list_response`.
- `?category=` follows `_filter_by_category` in
  `backend/games/views/game_tasks/game_tasks_list.py`: only a known choice value filters.
  Unlike tasks, an **unknown value returns an empty list** (spec).
- Out of scope: write endpoints, `game_recipe/endpoints.yml`, permission flags (#1446),
  `CharacterRecipe` and `recipes/<id>/characters.json` (#1447), Navi (#1448), frontend.

## Steps

- [01 — Add the GameRecipe model](backend/01-add-gamerecipe-model.md)
- [02 — Add the read serializers with output masking](backend/02-add-read-serializers.md)
- [03 — Add the game recipe views and routes](backend/03-add-game-recipe-views.md)
- [04 — Add the common item → recipes views and routes](backend/04-add-common-item-recipes-views.md)
- [05 — Document access control and the product entity](backend/05-add-docs.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI jobs: `pytest_views_rest`,
  `pytest_all`)
- `backend`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)
- docs: `docker-compose run --rm majora_fe yarn lint_md` (CI job: `markdownlint`)

## Notes

- `GameCommonItem` is not registered in the Django admin today, even though the spec says its
  deletion is admin-only. This issue only registers `GameRecipe`. Registering `GameCommonItem`
  is out of scope.
- No `X-Skip-Cache` on the plain endpoints, and no Navi resources here (#1448).
- Access-control docs cover the read part only. #1446 extends them with the write endpoints.

# Issue: Add GameRecipe model and read endpoints

## Description
Part of #1441 (crafting recipes). Add the `GameRecipe` model and its **read** API. The spec pages are the source of truth: `docs/agents/specs/recipes.md` (index), `recipes/game-recipe.md`, `recipes/visibility.md`, `recipes/deletion.md`, `recipes/permissions.md` and `recipes/api-contract.md`.

A `GameRecipe` is a per-game recipe that produces exactly one `GameCommonItem` (potion, poison, ammunition...).

## Problem
Games have no way to record crafting recipes. The write endpoints (#1446), `CharacterRecipe` (#1447), Navi resources (#1448) and the frontend (#1449/#1450) all depend on the model and read endpoints landing first.

## Expected Behavior
### Model
- `GameRecipe` under `backend/games/models/game/`, modeled on `GameCommonItem`, with `HistoricalRecords`, migrations and admin registration.
- Fields: `game` (FK), `name` (required, ≤200, duplicates allowed within a game), `description` (markdown), `hidden` (bool, default `false`), `game_common_item` (FK, `on_delete=CASCADE`, not unique), `yield_quantity` (int, min 1, default 1), `crafting_time` (string, ≤200, default `""`), `crafting_cost` (int, min 0, default 0, lowest currency denomination), `ingredients` and `checks` (markdown free text, default `""`).
- **No photo model and no own `photo_path`.** Recipes have no uploads of any kind (decided in #1443).

### Read endpoints
All index endpoints use standard pagination (`paginated_list_response`, `?page=` / `?per_page=`) and are ordered by `id`.

| Endpoint | Tier | Notes |
|---|---|---|
| `GET /games/<slug>/recipes.json` | AllowAny | excludes hidden recipes, output masked, `?category=` |
| `GET /games/<slug>/recipes/all.json` | GameEdit | includes hidden, adds `hidden`, real output, `?category=` on the real category, `X-Skip-Cache: true` |
| `GET /games/<slug>/recipes/<id>.json` | AllowAny | `404` if hidden or unknown, output masked |
| `GET /games/<slug>/recipes/<id>/full.json` | GameEdit | returns hidden too, adds `hidden`, real output, `X-Skip-Cache: true` |
| `GET /games/<slug>/common_items/<id>/recipes.json` | AllowAny | `404` if the common item is hidden or unknown; excludes hidden recipes; output never masked (the item is visible by construction) |
| `GET /games/<slug>/common_items/<id>/recipes/all.json` | GameEdit | works even if the common item is hidden; includes hidden recipes, adds `hidden`, `X-Skip-Cache: true` |

### Response shapes
- Index item: `id`, `name`, `yield_quantity`, `crafting_time`, `crafting_cost`, `output`. The `/all.json` variant adds `hidden`.
- Detail: the index item plus `description`, `ingredients`, `checks`. The `/full.json` variant adds `hidden`.
- `output` is a nested `{id, name, photo_path, category}`, and its `photo_path` is the common item's own photo (the only image in a recipe payload). On plain variants the whole `output` is `null` when the `GameCommonItem` is hidden.

### Category filter
- `?category=` is matched by exact equality against the `GameCommonItem.category` choices. An unknown value returns an empty list, not `400`, and the value is never interpolated into raw SQL.
- On the plain endpoint, recipes whose output is masked **never match** a category filter. Without a filter they still appear, masked.
- Follow the style of `backend/games/views/game_tasks/game_tasks_list.py`.

## Solution
- Backend: model, migration, admin, serializers (plain / full plus the output object with masking), views and URL routes for the six endpoints above.
- Docs: new `docs/agents/access-control/game-recipe.md` (read part) plus its index entry, and a product entity doc under `docs/agents/product/entities/`.
- Tests for every endpoint: tiers (`401`/`403`/`404`), hidden exclusion, output masking vs. real output, `X-Skip-Cache` on the restricted variants, the category filter (including masked-never-matches and the unknown value), pagination and ordering.

### Out of scope
- Write endpoints, `game_recipe/endpoints.yml`, `can_create_recipe` and `/permissions/game_recipe.json` (#1446).
- `CharacterRecipe`, including `/games/<slug>/recipes/<id>/characters.json` (#1447).
- Navi resources (#1448) and frontend (#1449/#1450).
- Any delete endpoint (admin-only) and any photo upload.

## Benefits
Gives the rest of the recipes work a stable model and read contract to build on. Masking and filtering are decided up front, so a hidden output item cannot leak through a recipe.

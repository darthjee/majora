# Game Content Copy: Recipes

Part of [Game Content Copy](../game-content-copy.md); only the rules specific to the **Recipes**
tab. Endpoint access and exposed fields: [Staff Copy](../access-control/staff-copy.md).

## Model

- Tab slug `recipes`, label "Recipes", model `GameRecipe`
  (`backend/games/models/game/game_recipe.py`): `game`, `name`, `description`, `hidden`, the
  required `game_common_item` FK, `yield_quantity`, `crafting_time`, `crafting_cost`,
  `ingredients`, `checks`, `copied_from`.
- Recipes have **no photos**: no photo model and no cover FK.
- Copy type: `RecipesCopyType` (`backend/staff/copy_types_recipes.py`).

## Copied fields

| Field | Value on the copy |
|-------|-------------------|
| `name`, `description`, `yield_quantity`, `crafting_time`, `crafting_cost`, `ingredients`, `checks`, `hidden` | Source value. |
| `game` | The target game. |
| `copied_from` | The source recipe. |
| `game_common_item` | A common item of the target game, resolved as in [Common item](#common-item). |

## Not copied

- `CharacterRecipe` rows pointing to the source.
- The source's history.

## Common item

`GameRecipe` is the only copyable model with a required in-game FK, and a copy never references
a row of another game. `RecipeCommonItemResolver` (`backend/staff/copy_recipe_common_item.py`)
resolves the source recipe's common item in the target game:

- **Reuse**: when the target game holds a `GameCommonItem` whose `copied_from` is the source
  recipe's common item, the copy points to it; with several, the newest (highest `id`). The
  reused common item is left unchanged: no field update, no photo row, no link.
- **Direct lookup only**: the `copied_from` chain is never walked. Common item A1 of game A
  copied into game B as B1: copying a recipe of B (pointing to B1) back into A does **not**
  reuse A1, so a new common item is copied into A.
- **Copy**: otherwise the common item is copied **inside the recipe's transaction** with every
  [common items](common-items.md) rule (copied fields, `hidden`, `copied_from`, cover link
  with `is_cover=true` when the source cover is ready). A failure rolls back both.
- **Sequential copies**: the page copies one entity per request, so when two selected recipes
  share a common item not yet in the target, the first request copies it and the second reuses
  that copy.

The `201` `links` holds 0 or 1 entry: the dependency common item's cover, only when the common
item is copied (not reused) and its cover is ready. A common item copied this way is later
listed in the Common items tab with `copied_to_target` set.

## Names

Name clashes in the target game are allowed, for the recipe and for a common item copied as a
dependency.

## List rows

`GET staff/copies/recipes.json` lists every recipe of the source game (hidden ones included),
ordered by `id`: `id`, `name`, `hidden`, `yield_quantity`, `crafting_cost`,
`copied_to_target`, and `common_item` = `{id, name, copied_to_target}`, whose
`copied_to_target` is true when a direct copy exists in the target (it will be reused).

## Cache

The copy `201` sends `X-Cache-Clear` (`RecipesCopyType.cache_paths` plus the resolver's extra
paths), cleared on every domain ([Cache](../game-content-copy.md#cache)):

- the target's recipe family (`GameResourceCachePaths('recipes', **FULL_FAMILY)`):
  - `/games/<target>/recipes.json`
  - `/games/<target>/recipes/all.json`
  - `/games/<target>/recipes/<copy-id>.json`
  - `/games/<target>/recipes/<copy-id>/full.json`
- the nested recipe lists of the resolved common item, reused or copied:
  - `/games/<target>/common_items/<common-item-id>/recipes.json`
  - `/games/<target>/common_items/<common-item-id>/recipes/all.json`
- when the common item is copied (not reused): its family, as in
  [common items](common-items.md#cache). Its cover link's finalize clears that family again.

No clearing is needed for `/recipes/<copy-id>/characters*.json` (a fresh copy has no
characters) nor for the characters' `recipes/available*.json` lists, which always send
`X-Skip-Cache`.

## Frontend

`StaffCopyRecipeRow` renders the name, the common item name with a "reused" or "will be copied"
badge (from `common_item.copied_to_target`), and the hidden badge. The badge reflects the list
as loaded: a common item copied earlier in the same run still shows "will be copied" until the
list is reloaded after the run. The backend resolves the dependency at copy time.

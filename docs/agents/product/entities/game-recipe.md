# GameRecipe

A **GameRecipe** is a crafting recipe belonging to exactly one game that produces exactly one
[`GameCommonItem`](../../access-control/game-common-item.md) — a potion, a poison, ammunition, and
so on (issue #1445). It describes *how* the output is made; crafting itself is not a mechanic in
Majora (nothing is consumed or added to an inventory).

## Relationships

- `Game` 1 — N `GameRecipe` (`game.recipes`).
- `GameCommonItem` 1 — N `GameRecipe` as the **output** (`game_common_item`, reachable as
  `common_item.recipes`). The output is required, must belong to the same game, and is not
  unique: several recipes may produce the same item (e.g. different methods for the same
  potion). Deleting the output item deletes its recipes (cascade).

## Fields

- `name` — required, ≤200 chars; duplicate names within a game are allowed.
- `description` — markdown.
- `yield_quantity` — units produced per crafting, at least `1` (defaults to `1`).
- `crafting_time` — optional free text such as "8 hours".
- `crafting_cost` — an integer in the **lowest currency denomination**, like
  `GameCommonItem.price` and `Treasure.value`; at least `0` (defaults to `0`). The frontend
  displays and edits it as money, like a common item's price.
- `ingredients` — free markdown text; there is no ingredient entity and no link to other common
  items.
- `checks` — free markdown text describing the skill/difficulty options, any of which a character
  can use (e.g. "Alchemy DC 15 or Herbalism DC 18"); there is no skill-check entity.
- `hidden` — see below.

Recipes have no photo and no uploads; the only image shown for a recipe is its output item's
photo. Change history is tracked like the sibling game models.

## Hidden semantics

- A hidden recipe is only visible to callers who can edit the game (GM/admin/superuser), through
  the restricted `/all.json` and `/full.json` variants.
- When a visible recipe's output item is hidden, the recipe is still listed publicly but its
  output is shown as unknown (`null`), so the recipe never reveals a hidden item. The category
  filter never matches such a recipe for public callers.

See [access-control/game-recipe.md](../../access-control/game-recipe.md) for the endpoint and
permission breakdown.

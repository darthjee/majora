# CharacterRecipe

The join recording that a PC or NPC knows a [`GameRecipe`](game-recipe.md).
Part of the [Recipes spec](../recipes.md).

## Fields

A thin join modeled on `CharacterPossession`
(`backend/games/models/character/character_possession.py`):

| Field | Type | Rules |
|-------|------|-------|
| `character` | FK to `Character` | PC or NPC |
| `game_recipe` | FK to `GameRecipe` | The known recipe |
| `hidden` | boolean | Own flag, independent of `GameRecipe.hidden` — see [Visibility](visibility.md) |

Display fields (name, photo, output, ...) come from the linked `GameRecipe`;
the join stores no copies of them.

## Constraints

- Unique `(character, game_recipe)` — linking the same recipe twice to a
  character is rejected.
- The recipe and the character must belong to the same game; otherwise the
  request is rejected with `400`.
- Only an **existing** `GameRecipe` can be linked — there is no
  create-from-scratch from the character page.
- Deleting the `Character` or the `GameRecipe` cascades to its
  `CharacterRecipe` rows (see [Deletion](deletion.md)).

## Flow

Mirrors `CharacterDocument`'s flow:

- **available** — recipes the character can still learn.
- **acquire** — link an available recipe.
- **`acquire/all`** — GM-only variant, can link hidden recipes.
- **remove** — the character "forgets" the recipe; the `GameRecipe` itself is
  untouched.

Exact routes and permission tiers are defined by the API contract (#1443); see
[Permissions](permissions.md) for the summary.

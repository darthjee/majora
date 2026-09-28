# Deletion

Cascade and remove behavior for recipes. Part of the
[Recipes spec](../recipes.md).

## GameCommonItem deletion cascades

`GameRecipe.game_common_item` uses `on_delete=CASCADE`: deleting a
`GameCommonItem` (Django admin only — there is no delete endpoint) deletes the
recipes that produce it and, in turn, their `CharacterRecipe` rows. The admin's
delete-confirmation page lists them.

## GameRecipe

`GameRecipe` has **no** delete endpoint — deletion is admin-only, like
`GameCommonItem`. Deleting a `GameRecipe` cascades to its `CharacterRecipe`
rows.

## CharacterRecipe

- `CharacterRecipe` gets a **remove** endpoint (the character "forgets" the
  recipe), mirroring `CharacterPossession`'s remove flow. The underlying
  `GameRecipe` is untouched.
- Deleting a `Character` cascades to its `CharacterRecipe` rows.

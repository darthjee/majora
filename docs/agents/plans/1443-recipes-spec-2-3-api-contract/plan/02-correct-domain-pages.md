# Correct the domain spec pages
The enhancement pass decided that recipes have **no photo and no uploads of any kind**, and that a
GM can toggle `CharacterRecipe.hidden` through a PATCH. Update the domain pages so they don't
contradict the contract:

- `recipes/game-recipe.md`:
  - remove the `photo` field row and the `GameRecipe 1 — 1 GameRecipePhoto` relationship;
  - add a note that the only image shown is the output common item's photo;
  - add `name` ≤200 chars if the contract states it (siblings use 200).
- `recipes/permissions.md`:
  - drop "photo upload" from the create/edit tier;
  - replace "Exact routes … (#1443)" / "pending" wording with a link to `api-contract.md`;
  - mention the `can_exchange_recipe` flag and the `hidden` PATCH tier.
- `recipes/character-recipe.md`: link `api-contract.md` instead of "defined by the API contract
  (#1443)", and add `available/all` and `remove/all` to the Flow list.
- `recipes/visibility.md`: link the `hidden` PATCH where it says "the GM can unhide it later". Its
  "no id, name or photo leaked" wording is still correct: it's about the output item's photo.

## Files to Change
- `docs/agents/specs/recipes/game-recipe.md`
- `docs/agents/specs/recipes/permissions.md`
- `docs/agents/specs/recipes/character-recipe.md`
- `docs/agents/specs/recipes/visibility.md`

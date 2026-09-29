# Add CharacterRecipe serializers with output masking

Add serializers under `backend/games/serializers/characters/`, mirroring
`character_possession.py`:

- `CharacterRecipeSerializer`: row `id`, plus the linked recipe's display fields taken from
  `game_recipe` (`game_recipe_id`, `name`, `description`, `ingredients`, `checks`,
  `yield_quantity`, `crafting_cost`, and whatever else the `GameRecipe` detail shape exposes),
  plus `output`. Store no copies; everything is sourced from `game_recipe`. Check
  `api-contract.md` for the exact field list and align it with the `GameRecipe` detail shape.
- `CharacterRecipeAllSerializer`: same as above plus `hidden` (`CharacterRecipe.hidden`, not
  `GameRecipe.hidden`), via the existing `HiddenFieldMixin`.
- `output`: reuse `GameRecipeOutputSerializer`. Mask it to `null` when
  `game_recipe.game_common_item.hidden` and masking is enabled. Masking defaults to **on**, and
  the view turns it off through a serializer context key (e.g. `mask_hidden_output=False`) only
  for `GameEdit` callers. The whole object is masked, never individual fields, as in
  `GameRecipeListSerializer`.
- The same serializers serve the list and the detail. If the contract gives the detail extra
  fields, add `CharacterRecipeDetailSerializer` / `CharacterRecipeDetailFullSerializer`.

Also add a lighter entry serializer for recipe → characters (step 05). It uses the same
character fields as the faction characters list (`game_faction_characters`), plus `hidden` for
`/all.json`.

Export them from `backend/games/serializers/__init__.py`. Add tests covering masked and
unmasked output, and the presence or absence of `hidden`.

## Files to Change

- `backend/games/serializers/characters/character_recipe.py`: new serializers.
- `backend/games/serializers/__init__.py`: exports.
- `backend/games/tests/serializers/characters/character_recipe_test.py` and
  `character_recipe_all_test.py`: tests.

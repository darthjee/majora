# Add the CharacterRecipe model

Create `CharacterRecipe`, mirroring `CharacterPossession` (`backend/games/models/character/character_possession.py`):

- `character`: FK to `games.Character`, `on_delete=CASCADE`, `related_name='character_recipes'`.
- `game_recipe`: FK to `games.GameRecipe`, `on_delete=CASCADE`, `related_name='character_recipes'`.
- `hidden`: `BooleanField(default=False)`. This is the row's own flag. #1459 copies it from
  `GameRecipe.hidden` on acquire; here it is a plain field.
- `history = HistoricalRecords(app='versioning', user_db_constraint=False)`.
- `Meta`: `ordering = ['id']`, `unique_together = [('character', 'game_recipe')]`.
- `__str__` returns `self.game_recipe.name`.

Export it from `backend/games/models/__init__.py` and register it in the Django admin next to
`CharacterPossession`. Generate the `games` migration and the `versioning` historical migration
through docker-compose (`makemigrations`). Add a factory and model tests covering the unique pair
and cascades: deleting the character, the `GameRecipe`, or the recipe's output
`GameCommonItem` removes the row.

## Files to Change

- `backend/games/models/character/character_recipe.py`: new model.
- `backend/games/models/__init__.py`: export.
- `backend/games/admin.py`: admin registration.
- `backend/games/migrations/0XXX_characterrecipe.py`: generated.
- `backend/versioning/migrations/0XXX_historicalcharacterrecipe.py`: generated.
- `backend/games/tests/factories/recipe.py` (or a new `character_recipe.py`) and
  `backend/games/tests/factories/__init__.py`: `CharacterRecipeFactory`.
- `backend/games/tests/models/character/character_recipe_test.py`: model tests.

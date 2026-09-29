# Add the GameRecipe model

Create `GameRecipe` in `backend/games/models/game/game_recipe.py`, modeled on `GameCommonItem`:

- `game` — FK `games.Game`, `on_delete=CASCADE`, `related_name='recipes'`.
- `name` — `CharField(max_length=200)`.
- `description` — `TextField(blank=True, default='')`.
- `hidden` — `BooleanField(default=False)`.
- `game_common_item` — FK `games.GameCommonItem`, `on_delete=CASCADE`, `related_name='recipes'`,
  not unique.
- `yield_quantity` — `PositiveIntegerField`/`IntegerField(default=1,
  validators=[MinValueValidator(1)])`.
- `crafting_time` — `CharField(max_length=200, blank=True, default='')`.
- `crafting_cost` — `IntegerField(default=0, validators=[MinValueValidator(0)])`.
- `ingredients`, `checks` — `TextField(blank=True, default='')`.
- `history = HistoricalRecords(app='versioning', user_db_constraint=False)`.
- `Meta.ordering = ['id']`, `__str__` returns `name`.

No photo FK and no `photo_path`.

Export the model from `backend/games/models/__init__.py`. Generate the `games` migration and the
`versioning` historical-model migration through docker-compose (`makemigrations`). Register
`GameRecipe` in `backend/games/admin.py` so the admin can delete it. Add a
`GameRecipeFactory` (defaulting `game_common_item` to a common item of the same game) and export
it from the factories package. Add model tests covering defaults, `__str__`, ordering and the
cascade when the `GameCommonItem` is deleted.

## Files to Change

- `backend/games/models/game/game_recipe.py` — new model
- `backend/games/models/__init__.py` — export `GameRecipe`
- `backend/games/migrations/<new>.py`, `backend/versioning/migrations/<new>.py` — generated
- `backend/games/admin.py` — register `GameRecipe`
- `backend/games/tests/factories/recipe.py`, `backend/games/tests/factories/__init__.py` — factory
- `backend/games/tests/models/game/game_recipe_test.py` — model tests

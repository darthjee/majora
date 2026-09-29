# Create and update views

Add a new module `_recipe_write.py`.

- `_response_serializer(is_game_edit)` picks `GameRecipeDetailFullSerializer` or
  `GameRecipeDetailSerializer` (E2).
- `game_recipe_create(request, game)`:
  1. Run `EndpointPermission(request.user, game=game).check(request, 'game_recipe',
     'regular', 'create')`.
  2. Validate with context `{'game': game, 'allow_hidden_output':
     game.can_be_edited_by(request.user)}` through `validated_or_error`.
  3. Call `serializer.save(game=game)`, then return 201 with the tier serializer.
- `game_recipe_update(request, game, recipe_id)`:
  1. Run the same check with `'edit'`.
  2. Look the recipe up in `game.recipes.all()` for `GameEdit` callers, or in
     `game.recipes.filter(hidden=False)` otherwise. Return an explicit `Response(status=404)`
     when it is missing (E3, unknown id, other game).
  3. Validate with `partial=True`, save, and return 200 with the tier serializer.
- Wrap both with `skip_cache`, so every write response (201/200/400/401/403/404) carries
  `X-Skip-Cache: true`.
- In `game_recipes.py`, switch to `@api_view(['GET', 'POST'])` and add a POST branch. Update the
  AllowAny comment to say that POST authorization is enforced inline.
- In `game_recipe_detail.py`, switch to `@api_view(['GET', 'PATCH'])` and add a PATCH branch.
  GET behavior is unchanged.
- Keep functions small for xenon.

## Files to Change

- `backend/games/views/game/recipes/_recipe_write.py` — new
- `backend/games/views/game/recipes/game_recipes.py` — POST branch
- `backend/games/views/game/recipes/game_recipe_detail.py` — PATCH branch

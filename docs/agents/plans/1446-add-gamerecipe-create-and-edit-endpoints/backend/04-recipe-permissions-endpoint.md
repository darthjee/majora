# Recipe permissions endpoint

Add `GET /permissions/game_recipe.json` (AllowAny, role-simulated `can_edit`). It mirrors
`/permissions/game_common_item.json`.

- Serializer `GameRecipePermissionsSerializer`: a copy of `GameCommonItemPermissionsSerializer`
  with `_PAGE_KEY = 'game_recipe'`. Register it in `serializers/__init__.py`.
- View `game_recipe_permissions`: a copy of `game_common_item_permissions`. Export it from
  `views/permissions/__init__.py`.
- Route: `path('permissions/game_recipe.json', game_recipe_permissions,
  name='permissions-game-recipe')`.

## Files to Change

- `backend/games/serializers/games/recipes/game_recipe_permissions.py` — new
- `backend/games/serializers/__init__.py` — export the serializer
- `backend/games/views/permissions/game_recipe_permissions.py` — new
- `backend/games/views/permissions/__init__.py` — export the view
- `backend/games/urls/permissions.py` — add the route

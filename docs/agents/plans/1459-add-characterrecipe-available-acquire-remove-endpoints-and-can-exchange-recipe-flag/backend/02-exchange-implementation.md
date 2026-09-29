# Exchange implementation (available / acquire / remove)

Create `games/views/game/recipes/_recipe_exchange.py`, modeled on `_document_exchange.py`, with
these functions (each decorated with `check_hidden` like the document ones):

- `character_recipes_available(request, game, character, check_hidden, allow_hidden=False,
  serializer_class=...)`
  - Queryset: `game.recipes`, excluding
    `game_recipe_id`s linked through **any** of the character's `character_recipes`, hidden rows
    included.
  - Unless `allow_hidden`, also exclude `GameRecipe.hidden=True`.
  - `?name=` via `common.query_filters.filter_by_name(request, qs, field='name')`, which
    `_character_recipes.py` already uses. Order by `id`.
  - Paginate with `paginated_list_response`. Always set `X-Skip-Cache: true`.
  - Use `select_related('game_common_item__photo')`, like `_character_recipe_rows`, to avoid
    N+1 queries on `output`.
- `character_recipe_acquire(request, game, character, check_hidden, allow_hidden=False)`
  - Validate `{game_recipe_id: int}`; a missing or non-integer id returns `400` through
    `validated_or_error`.
  - Look up `GameRecipe.objects.filter(id=...)` **without** a game scope. If it exists and
    `game_id != game.id`, return `400` with an errors body keyed on `game_recipe_id` (for
    example `game_recipe_from_another_game`). This check comes first and ignores that recipe's
    `hidden`.
  - Return `404` if the recipe is unknown, or if it is hidden and `allow_hidden` is false.
  - `get_or_create` with `defaults={'hidden': game_recipe.hidden}`. If the row already
    exists, return `422` `{'errors': {'game_recipe_id': ['game_recipe_already_known']}}` (E4).
  - Return `201`. The plain variant uses `CharacterRecipeDetailSerializer` with
    `mask_hidden_output=True` (no `hidden`, output masked). The `/all` variant uses
    `CharacterRecipeDetailFullSerializer` with `mask_hidden_output=False` (GameEdit caller).
    Pass the serializer class and mask in as parameters from the builder.
  - Always set `X-Skip-Cache: true`.
- `character_recipe_remove(request, game, character, check_hidden, allow_hidden=False)`
  - Validate `{game_recipe_id: int}`.
  - Find `character.character_recipes.filter(game_recipe_id=...)`. Return `404` if there is no
    row (E8), or if the row is hidden and `allow_hidden` is false (E6).
  - Delete the row and return `204`. Never touch the `GameRecipe`. Always set
    `X-Skip-Cache: true`.

Permission checks live in the view builders (step 03), not here. That way the NPC hidden gate
provably runs first, and GameEdit vs CharacterEdit vs `regular.create` are chosen per endpoint.
Keep the `@check_hidden` decorator for the character lookup and the hidden-gate behavior.

## Files to Change
- `backend/games/views/game/recipes/_recipe_exchange.py` — new

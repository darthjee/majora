# Write serializer

Add `GameRecipeWriteSerializer(ModelSerializer)`, used for both POST (non-partial) and PATCH
(`partial=True`).

- Set an explicit `Meta.fields` allowlist: `name`, `description`, `yield_quantity`,
  `crafting_time`, `crafting_cost`, `ingredients`, `checks`, `hidden`, `game_common_item_id`.
  Leave out `game` and `id`.
- Define `yield_quantity` as `IntegerField(required=False, min_value=1, max_value=2147483647)`.
- Define `crafting_cost` as `IntegerField(required=False, min_value=0, max_value=2147483647)`.
- `name` (≤200 chars) and `game_common_item_id` are required on create. Everything else is
  optional and falls back to the model default.
- Make `game_common_item_id` a small `PrimaryKeyRelatedField` subclass with
  `source='game_common_item'`. Its `get_queryset()` returns `context['game'].common_items`,
  filtered with `hidden=False` unless `context['allow_hidden_output']` is set.
  - Unknown, cross-game and (on the regular tier) hidden ids all fail the same way:
    `400 {'errors': {'game_common_item_id': ['does_not_exist']}}`.
  - Non-integer and boolean input returns 400 `incorrect_type`, never a 500.
  - This covers E1.
- Register the serializer in `backend/games/serializers/__init__.py`, in both `__all__` and the
  lazy map.

## Files to Change

- `backend/games/serializers/games/recipes/game_recipe_write.py` — new
- `backend/games/serializers/__init__.py` — export the serializer

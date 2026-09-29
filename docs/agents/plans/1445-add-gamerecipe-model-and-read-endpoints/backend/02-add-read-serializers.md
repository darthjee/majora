# Add the read serializers with output masking

Create `backend/games/serializers/games/recipes/` (per `docs/agents/serializers-organization.md`):

- `game_recipe_output.py` — `GameRecipeOutputSerializer` over `GameCommonItem` with `id`, `name`,
  `photo_path` (`source='photo.path', default=None`, as in `GameCommonItemListSerializer`) and
  `category`.
- `game_recipe_list.py`:
  - `GameRecipeListSerializer` — `id`, `name`, `yield_quantity`, `crafting_time`,
    `crafting_cost` and `output`. `output` is a `SerializerMethodField` that returns `None` when
    `game_common_item.hidden` is true, otherwise the output serializer's data. The whole object
    is masked, never individual fields.
  - `GameRecipeAllListSerializer` — `HiddenFieldMixin` plus `hidden`, and the **real** output
    (no masking).
  - `GameRecipeDetailSerializer` — list fields plus `description`, `ingredients` and `checks`,
    with the output masked.
  - `GameRecipeDetailFullSerializer` — detail plus `hidden`, with the real output.

Keep the masking decision in a single place, e.g. a `mask_hidden_output` class attribute
checked by `get_output`, set to `False` on the `All` / `Full` variants. The PC `CharacterEdit`
masking for #1447 can then reuse it.

Register the new names in the lazy map in `backend/games/serializers/__init__.py`. Add serializer
tests under `backend/games/tests/serializers/games/recipes/` covering the field sets, the masked
`null` output, the real output on the `All` / `Full` variants, and `photo_path` being `None` when
the common item has no photo.

## Files to Change

- `backend/games/serializers/games/recipes/__init__.py`, `game_recipe_output.py`,
  `game_recipe_list.py` — new serializers
- `backend/games/serializers/__init__.py` — lazy-map entries
- `backend/games/tests/serializers/games/recipes/*_test.py` — tests

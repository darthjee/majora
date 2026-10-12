# Recipes copy type with common item resolution

Create `RecipesCopyType(ModelCopyType)` (slug `recipes`, model `GameRecipe`):

- `copied_fields = ('name', 'description', 'yield_quantity', 'crafting_time', 'crafting_cost',
  'ingredients', 'checks', 'hidden')`.
- `serializer_class` → `StaffCopyRecipeSerializer`; `source_queryset` adds
  `select_related('game_common_item')`; `list_queryset` adds the
  `common_item_copied_to_target` annotation on top of `super().list_queryset(...)`.
- Override `copy_instance(request, source, target_game)` — the recipe row cannot be created
  before its required `game_common_item` is known:
  1. **Reuse**: `GameCommonItem.objects.filter(game=target_game,
     copied_from=source.game_common_item).order_by('-id').first()`. Direct lookup only — never
     walk the `copied_from` chain. A reused common item is left untouched (no update, no photo
     row, no upload).
  2. **Copy** otherwise: `copy_types.find('common_items').copy_instance(request,
     source.game_common_item, target_game)` (or a module-level `CommonItemsCopyType()`), which
     applies every common-items rule (fields, `hidden`, `copied_from`, cover link with
     `is_cover=true` when the cover is ready). Its uploads become the recipe's `links`.
  3. Create the recipe with `game=target_game`, `copied_from=source`, the copied values and the
     resolved `game_common_item`.
  Everything runs inside the base `copy()` transaction, so a failure rolls back both rows.
  Avoid a circular import between `copy_types` and the new module.
- No `copy_associations` (recipes have no photos); `CharacterRecipe` rows and history are not
  copied. Name clashes are allowed (no `422`).

The cache paths depend on whether the common item was reused or copied (step 03), which the
current `cache_paths(copy)` hook cannot tell. Extend `ModelCopyType` minimally so a type can
return extra cache paths from `copy_instance` (e.g. a third element / small result object
consumed by `_copy_response`), keeping `items` and `common_items` behavior and tests unchanged.

## Files to Change
- `backend/staff/copy_types_recipes.py` — new copy type.
- `backend/staff/copy_type_base.py` — minimal hook so a copy can contribute dependency cache paths.

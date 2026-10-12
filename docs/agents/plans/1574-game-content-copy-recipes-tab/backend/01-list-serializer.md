# Recipe list row serializer

Add `StaffCopyRecipeSerializer` (`ModelSerializer` over `GameRecipe`) with fields `id`, `name`,
`hidden`, `yield_quantity`, `crafting_cost`, `common_item`, `copied_to_target`.

- `copied_to_target` reads the base `list_queryset` annotation (as the other row serializers do).
- `common_item` is `{id, name, copied_to_target}` of `game_common_item`; its `copied_to_target`
  reads a second annotation added by the recipes copy type's `list_queryset` (step 02), e.g.
  `common_item_copied_to_target = Exists(GameCommonItem.objects.filter(game=to_game,
  copied_from=OuterRef('game_common_item')))`.
- Never expose `copied_from`.

## Files to Change
- `backend/staff/serializers/staff_copy_recipe.py` — new serializer.
- `backend/staff/serializers/__init__.py` — export it.

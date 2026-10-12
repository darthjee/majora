# Common items copy type and serializer

Add `CommonItemsCopyType(ModelCopyType)` over `GameCommonItem`, mirroring `ItemsCopyType`:

- slug `common_items`, `copied_fields = ('name', 'price', 'description', 'category', 'hidden')`;
- `serializer_class()` returns a new `StaffCopyCommonItemSerializer` (fields `id`, `name`,
  `category`, `price`, `hidden`, `photo`, `copied_to_target`; `photo` is the cover path only
  when ready, like `StaffCopyItemSerializer`, and `copied_from` is never exposed);
- `source_queryset` adds `select_related('photo')`;
- `copy_associations` uses `CoverPhotoLinkBuilder('game_common_item', request.user)` with
  segments `['games', copy.game.game_slug, 'common_items', copy.pk]`, returning `[]` or
  `[upload]`. Only `source.photo` is considered; a missing or not-ready cover yields no link;
- `cache_paths(copy)` returns `common_items_copy_cache_paths(copy)` (step 02).

Register it in `COPY_TYPES` right after `ItemsCopyType()`.

For the Recipes tab reuse, add a public method on `ModelCopyType` (e.g.
`copy_instance(request, source, target_game)` returning `(copy, uploads)`, with no transaction
or Response of its own) and make `_copy_current` call it, so #1574 can copy a recipe's common
item inside its own transaction and merge the uploads and cache paths. Keep public methods
before private ones.

## Files to Change
- `backend/staff/copy_types_common_items.py` — new `CommonItemsCopyType`.
- `backend/staff/copy_types.py` — import and register after `ItemsCopyType()`.
- `backend/staff/copy_type_base.py` — public `copy_instance` used by `_copy_current`.
- `backend/staff/serializers/staff_copy_common_item.py` — new row serializer.
- `backend/staff/serializers/__init__.py` — export it.

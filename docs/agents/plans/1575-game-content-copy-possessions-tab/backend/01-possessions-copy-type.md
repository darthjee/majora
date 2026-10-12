# Possessions copy type, serializer and cache paths

Add the `possessions` copy type, modelled on `ItemsCopyType`.

- **Serializer**: `StaffCopyPossessionSerializer` in `backend/staff/serializers/staff_copy_possession.py`, a copy of `StaffCopyItemSerializer` on `GamePossession`:
  - fields `id`, `name`, `hidden`, `photo`, `copied_to_target`;
  - `photo` is the cover path only when the cover is ready.
  - Export it from `backend/staff/serializers/__init__.py`.
- **Cache paths**: in `backend/staff/copy_cache_paths.py`, add `possessions_copy_cache_paths(possession)`. It returns `photo_types.find('game_possession').cache_paths(possession)` (the `FULL_FAMILY` possession paths: `possessions.json`, `possessions/all.json`, `possessions/<id>.json`, `possessions/<id>/full.json`), plus `GameCharactersAvailableCachePaths('possessions').paths(possession.game)`. That second part is one `/games/<target>/{pcs|npcs}/<id>/possessions/available.json` per character, and nothing when the target game has none.
- **Copy type**: `PossessionsCopyType(ModelCopyType)` in `backend/staff/copy_types_possessions.py`:
  - slug `possessions`, model `GamePossession`;
  - `copied_fields = ('name', 'description', 'hidden')`;
  - `serializer_class()` returns `StaffCopyPossessionSerializer`;
  - `source_queryset` adds `select_related('photo')`;
  - `copy_associations` uses `CoverPhotoLinkBuilder('game_possession', request.user).build(source.photo, copy, ['games', copy.game.game_slug, 'possessions', copy.pk])` and returns `[]` or `[upload]`. That gives the fixed `photos/games/<target>/possessions/<copy-id>/photo<ext>` path. A missing or not-ready cover gives no link, and non-cover photos and `CharacterPossession` rows are never touched;
  - `cache_paths(copy)` returns `possessions_copy_cache_paths(copy)`.
- **Registry**: register `PossessionsCopyType()` **last** in `COPY_TYPES` in `backend/staff/copy_types.py`. That is the spec tab order: items, common_items, recipes, documents, factions, possessions. Documents and factions are not merged yet, so they will insert before it later.

## Files to Change
- `backend/staff/serializers/staff_copy_possession.py` — new list row serializer.
- `backend/staff/serializers/__init__.py` — export it.
- `backend/staff/copy_cache_paths.py` — add `possessions_copy_cache_paths`.
- `backend/staff/copy_types_possessions.py` — new `PossessionsCopyType`.
- `backend/staff/copy_types.py` — import and register it last.

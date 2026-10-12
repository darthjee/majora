# Factions copy type

Add `FactionsCopyType(ModelCopyType)` in `backend/staff/copy_types_factions.py`, modelled on
`copy_types_possessions.py`:

- `super().__init__('factions', GameFaction)`, `copied_fields = ('name',)`, serializer
  `StaffCopyFactionSerializer`, `source_queryset` with `select_related('photo')`.
- Override `list_queryset(from_game, to_game)` to also annotate
  `name_taken_in_target=Exists(GameFaction.objects.filter(game=to_game, name=OuterRef('name')))`.
- `copy_associations` builds the cover link with
  `CoverPhotoLinkBuilder('faction', request.user).build(source.photo, copy, ['games', copy.game.game_slug, 'factions', copy.pk])`
  (fixed `photo<ext>` path, no link when there is no photo or it is not ready). Only the cover is
  copied; `CharacterFaction` rows and non-cover photos are not.
- `cache_paths(copy)` returns `factions_copy_cache_paths(copy)`.
- Override `copy` to catch `IntegrityError` (raised from inside the atomic block so everything is
  rolled back) and return `Response({'errors': {'name': ['unique']}}, status=422)` with no
  `X-Cache-Clear` header.

Register `FactionsCopyType()` in `backend/staff/copy_types.py` between `RecipesCopyType()` and
`PossessionsCopyType()`.

## Files to Change
- `backend/staff/copy_types_factions.py` — new copy type
- `backend/staff/copy_types.py` — registration

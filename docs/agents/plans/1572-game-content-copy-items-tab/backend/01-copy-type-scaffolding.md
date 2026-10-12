# Shared copy-type scaffolding
Give `CopyType` (or a subclass in `backend/staff/`) the list/copy behavior every tab repeats, so
a tab only declares its queryset, row serializer, copied fields and extra rows.

- **List**: `source_queryset(from_game)` (default: `model.objects.filter(game=from_game)
  .order_by('id')`), annotated with `copied_to_target` via an `Exists` subquery on
  `model.objects.filter(game=to_game, copied_from=OuterRef('pk'))`, paginated with
  `games.paginator.Paginator`, serialized with a per-type serializer class, returned as a
  `Response` with the paginator headers. Mirror `staff_photos_list._paginated_response`.
- **Copy**: inside `transaction.atomic()`, re-read the source (`select_for_update` not needed;
  the spec only asks for its current state inside the transaction), create the copy from a
  per-type `copied_fields` tuple plus `game=target_game`, `copied_from=source`, call a per-type
  hook that creates associated rows and returns the created copy-origin `Upload`s, then build
  `201 {id, links: [{upload_id, upload_type, token}]}` and attach `X-Cache-Clear` with a per-type
  `cache_paths(copy)` via `staff.cache_clear_header.attach_cache_clear`.
- A small serializer/helper for the `links` entries (never paths).

Unit-test the scaffolding with a minimal test subclass (the existing `FakeCopyType` pattern in
`copy_test_support.py`), independent of items.

## Files to Change
- `backend/staff/copy_types.py` — scaffolding on `CopyType` (or a new `backend/staff/copy_type_base.py` imported by it); keep the module free of view concerns apart from building the `Response`.
- `backend/staff/serializers/staff_copy_result.py` (new) — `links` entry shape; export in `serializers/__init__.py`.
- `backend/staff/tests/copy_types_test.py` — scaffolding tests (list annotation/ordering/pagination, transactional copy, response shape, header).
- `backend/staff/tests/copy_test_support.py` — any shared fixtures the tab tests reuse.

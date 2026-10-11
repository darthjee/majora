# Copy-link registry (game reach, cover, cache-path hook)

Create `backend/staff/copy_links.py`, a registry with one `CopyLink` entry per copyable photo/file model. It is free of HTTP concerns, like `copy_types.py` and `photo_types.py`. Each entry exposes:

- `model` — one of `GameItemPhoto`, `GameCommonItemPhoto`, `GameFactionPhoto`, `GamePossessionPhoto`, `GameDocumentPhoto`, `GameDocumentFile`, `GameDocumentFilePhoto`.
- `object_ids_in(game)` — a queryset/values list of the row ids belonging to `game`, used by the pending-links query.
  - Direct owners filter on the owner's game: `game_item__game`, `game_common_item__game`, `faction__game`, `game_possession__game`, `game_document__game`.
  - `GameDocumentFile` filters on `game_document__game`.
  - `GameDocumentFilePhoto` reaches its game only through `GameDocumentFile.photo`: `GameDocumentFile.objects.filter(game_document__game=game).values('photo_id')`.
- `photo_type` — `photo_types.find_for_model(model)`, reused for `owner_of` and `describe_owner`.
- `set_cover(row)` — sets `owner.photo = row` and saves. It applies only to the owner `photo` FK of `GameDocument`, `GameItem`, `GameCommonItem`, `GameFaction` and `GamePossession`. It is a no-op for `GameDocumentFile` and `GameDocumentFilePhoto`, because the file photo is assigned to its file when the copy is created.
- `cache_paths(row, upload)` — the **per-type hook** that the tab issues fill in, following each tab spec's "Cache" section. The default returns `[]`. Document it as a hook, with a module docstring that points to the tab specs.

Module-level helpers:
- `find_for_model(model)` → the entry or `None`.
- `models()` → the tuple of the seven models, used by step 04's signal wiring.

Tests (`backend/staff/tests/copy_links_test.py`):
- `object_ids_in` for each of the seven models, including the reverse lookup for document-file photos and the exclusion of other games;
- `set_cover` on each owner type, and the no-ops on files and file photos;
- the default `cache_paths` is `[]`.

## Files to Change
- `backend/staff/copy_links.py` — new registry.
- `backend/staff/tests/copy_links_test.py` — registry tests.

# Source/Collection find-or-create sync

Add a small helper module, modeled on the existing `_tags_sync.py` pattern (`get_or_create`
wrapped in `transaction.atomic()`), that resolves a `Source` and a `Collection` from the import
request's fields:

- `SourceSync` (or similar name): `Source.objects.get_or_create(name=source_name)`.
- `CollectionSync`: look up by `external_id` first (if given), then by `name` (if given and no
  `external_id` match found) — **globally**, not filtered by `source`, since `Collection.name`
  is globally unique. If found, set `collection.source = resolved_source` and save if it changed
  (always overwrite, even if it previously pointed elsewhere or was `None` — the resolved
  `Source` always wins). If not found, create it with `source=resolved_source` and whichever of
  `external_id`/`name` was used to look it up.

Keep this in its own module (e.g. `backend/miniatures/serializers/_crawler_import_sync.py`) so
the import serializer (step 03) can call it without duplicating lookup logic.

## Files to Change

- `backend/miniatures/serializers/_crawler_import_sync.py` (new) — `SourceSync`/`CollectionSync`
  helpers as described above.
- `backend/miniatures/tests/serializers/` — unit tests for the helper(s): create-new-`Source`,
  match-existing-`Source`-by-name, create-new-`Collection`-by-`external_id`,
  create-new-`Collection`-by-`name`-fallback, `external_id` takes precedence over a
  coincidentally-matching `name`, match-existing-`Collection`-and-reassign-`source`-when-null,
  match-existing-`Collection`-and-reassign-`source`-when-previously-different.

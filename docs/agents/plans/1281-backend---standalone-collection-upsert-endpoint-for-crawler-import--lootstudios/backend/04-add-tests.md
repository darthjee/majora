# Add tests

Follow the `stl_models/import.json` test layout precedent exactly.

## `backend/miniatures/tests/serializers/_crawler_import_sync_test.py` — extend `TestCollectionSync`

- Create-by-`external_id`-only (no `name`): resulting `Collection.name` falls back to the placeholder (the given `external_id`).
- Create-by-`name`-only (no `external_id`): unchanged existing behavior, still passes.
- `update_existing=False` (default) on a match: `name`/`url` are *not* changed — same as today's `_reassign_source`-only behavior (regression guard for the existing `stl_models/import.json` call path).
- `update_existing=True` on a match: `name`/`url` *are* updated from whatever's given, `source` is still (re)assigned.
- `resolve()` sets `sync.created` correctly: `True` on a fresh create, `False` on a match (both with and without `update_existing`).
- `_create()` now also stores `url` when given.

## `backend/miniatures/tests/serializers/collection_import_test.py` — new, `TestCollectionImportSerializer`

Mirror `stl_model_import_test.py`'s serializer test structure (inline data per test, no shared `setup_method`):

- Valid payload with `name`, `external_id`, `url`, `source_name` → creates a `Collection`, resolves/creates the `Source`, `serializer.created is True`.
- Missing `name` or `source_name` → validation error (both required).
- Omitted `external_id`/`url` → still valid (both optional).
- A payload matching an existing `Collection` by `external_id` → updates `name`/`url`, reassigns `source`, `serializer.created is False`.
- A payload matching an existing `Collection` by `name` (no `external_id` given) → same, matched via the `name` fallback.
- **Stub-then-fill sequence**: create a `Collection` stub via `CollectionSync(external_id=..., name=None)` directly (simulating what `stl_models/import.json` would produce), then run `CollectionImportSerializer` with the same `external_id` and a real `name`/`url` → results in one `Collection` row with the real `name`/`url`, not a duplicate and not an `IntegrityError`.

## `backend/miniatures/tests/views/collection_import_test.py` — new, `TestCollectionImportView(TokenAuthRequestMixin)`

Mirror `stl_model_import_test.py`'s view test structure (`@pytest.mark.django_db`, `setup_method` building superuser/staff/regular users + tokens via `SuperUserFactory`/`UserFactory` + `Token.objects.create`):

- 401 with no token.
- 403 for a non-staff regular user's token.
- 201 + detail-shaped response body for a valid payload creating a new `Collection` (staff and superuser tokens).
- 200 + detail-shaped response body for a valid payload matching an existing `Collection`.
- 400 for a payload missing `name`/`source_name`.

## Files to Change

- `backend/miniatures/tests/serializers/_crawler_import_sync_test.py` — extend `TestCollectionSync` with the cases above.
- `backend/miniatures/tests/serializers/collection_import_test.py` — new file, `TestCollectionImportSerializer`.
- `backend/miniatures/tests/views/collection_import_test.py` — new file, `TestCollectionImportView`.

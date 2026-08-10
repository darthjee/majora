# Backend Plan: Add miniatures/collection

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md#shared-contracts) for the full endpoint/field contract. This agent owns
producing all of it: the `Collection`/`CollectionPhoto` models, migrations, serializers, views,
urls, admin registration, tests, and the `docs/agents/access-control/collection.md` doc.

## Implementation Steps

### Step 1 — Models

- `backend/miniatures/models/collection.py` — `Collection(name: CharField(max_length=200, unique=True), url: CharField(max_length=200, unique=True, null=True, blank=True), source: FK('miniatures.Source', on_delete=SET_NULL, null=True, blank=True, related_name='collections'), photo: FK('miniatures.CollectionPhoto', on_delete=SET_NULL, null=True, blank=True, related_name='+'), history: HistoricalRecords(app='versioning', ...))` — mirror `source.py`'s exact `HistoricalRecords` wiring.
- `backend/miniatures/models/collection_photo.py` — `CollectionPhoto(BasePhoto)` with `collection = FK(Collection, on_delete=CASCADE, related_name='photos')`, mirroring `source_photo.py` exactly.
- `backend/miniatures/models/stl_model.py` — add `collections = models.ManyToManyField('miniatures.Collection', related_name='stl_models', blank=True)` alongside the existing `sources` field.
- `backend/miniatures/models/__init__.py` — export `Collection`, `CollectionPhoto`.
- Migrations: `backend/miniatures/migrations/000X_collection_collectionphoto_stlmodel_collections.py` (generate via `makemigrations`) plus the companion `backend/versioning/migrations/00XX_historicalcollection_historicalcollectionphoto_...py` for `HistoricalCollection`/`HistoricalCollectionPhoto`, matching how `0002_source_url_sourcephoto_source_photo.py` paired with `versioning/migrations/0025_...py` for `Source`.
- `backend/miniatures/admin.py` — `admin.site.register(Collection)` / `admin.site.register(CollectionPhoto)`.

### Step 2 — Serializers

- `backend/miniatures/serializers/collection_list.py` — `CollectionListSerializer`: `id`, `name`, `photo_url` (nullable), `stl_model_count` (e.g. `SerializerMethodField` returning `obj.stl_models.count()`).
- `backend/miniatures/serializers/collection_detail.py` — `CollectionDetailSerializer`: `id`, `name`, `url`, `photo_url`, `source` (nested `{id, name}` or `null`), `stl_models` (nested list of `{id, name}`).
- `backend/miniatures/serializers/collection_create.py` — `CollectionCreateSerializer`: `name` (required), `url` (optional). Copy `source_create.py`'s `validate_url` scheme-allowlist logic verbatim (same `ALLOWED_URL_SCHEMES`/control-char-stripping rationale applies unchanged).
- `backend/miniatures/serializers/__init__.py` — export the three new serializers.

### Step 3 — Views & URLs

- `backend/miniatures/views/collections_list.py` — `GET` (list, `IsAuthenticated`, paginated) + `POST` (create, `require_staff`), mirroring `sources_list.py`.
- `backend/miniatures/views/collection_detail.py` — `GET` detail, `IsAuthenticated`, mirroring `source_detail.py`.
- `backend/miniatures/views/collection_photo_upload.py` — mirrors `source_photo_upload.py`'s `UploadInitiator` wiring, with two behavioral changes (see [plan.md](plan.md#shared-contracts)):
  - `_build_file_path` uses a per-photo path (not the fixed `photo{ext}` Source uses), since multiple `CollectionPhoto` rows must coexist — e.g. `PhotoPathBuilder(['collections', collection_id], f'{filename_stem}{ext}', use_uuid=True).build()` (UUID-based, unlike Source's deterministic single path).
  - `_create_photo` always creates a new `CollectionPhoto` row (never reuses/overwrites an existing one); if `collection.photo_id is None` after creation, also set `collection.photo = new_photo; collection.save()`.
- `backend/miniatures/urls/collections.py` — `collections.json` (GET/POST), `collections/<id>.json` (GET), `collections/<id>/photo_upload.json` (POST), mirroring `urls/sources.py`.
- `backend/miniatures/urls/__init__.py` — register the new url module.

### Step 4 — Tests

Mirror `Source`'s full test suite shape 1:1 for the new resource:
- `backend/miniatures/tests/models/collection_test.py`, `collection_photo_test.py`.
- `backend/miniatures/tests/serializers/collection_list_test.py`, `collection_detail_test.py`, `collection_create_test.py`.
- `backend/miniatures/tests/views/collections_list_test.py`, `collection_detail_test.py`, `collection_photo_upload_test.py` — the upload test additionally covers: second upload appends a gallery row without touching `Collection.photo`; first upload sets `Collection.photo`.
- `backend/miniatures/tests/factories/__init__.py` — add `CollectionFactory`, `CollectionPhotoFactory` (mirror `SourceFactory`/`SourcePhotoFactory`).
- `backend/miniatures/tests/admin_test.py` — extend for `Collection`/`CollectionPhoto` registration, mirroring the existing `Source`/`SourcePhoto` assertions.
- Add a `StlModel.collections` relation test alongside the existing `sources` M2M coverage in `stl_model_test.py`.

### Step 5 — Docs

- `docs/agents/access-control/collection.md` — new file, same shape as `source.md` (resource category, permission table, fields, create endpoint, photo upload section — documenting the "every upload appends, first upload sets main" behavior explicitly since it deviates from `Source`'s single-slot replace).
- `docs/agents/access-control.md` — add `Collection` to the index, mirroring how `Source` was added there.
- `docs/agents/access-control/stl-model.md` — add a short note that `StlModel.collections` exists (M2M, not yet settable through any endpoint), mirroring how `sources` is documented there today.
- `docs/agents/architecture/backend.md` — extend the `miniatures/` section's model list to include `Collection`/`CollectionPhoto`.

## Files to Change

- `backend/miniatures/models/collection.py` (new)
- `backend/miniatures/models/collection_photo.py` (new)
- `backend/miniatures/models/stl_model.py` — add `collections` M2M
- `backend/miniatures/models/__init__.py` — exports
- `backend/miniatures/migrations/000X_*.py` (new)
- `backend/versioning/migrations/00XX_*.py` (new)
- `backend/miniatures/admin.py` — register new models
- `backend/miniatures/serializers/collection_list.py`, `collection_detail.py`, `collection_create.py` (new)
- `backend/miniatures/serializers/__init__.py` — exports
- `backend/miniatures/views/collections_list.py`, `collection_detail.py`, `collection_photo_upload.py` (new)
- `backend/miniatures/urls/collections.py` (new), `backend/miniatures/urls/__init__.py`
- `backend/miniatures/tests/**` — new/updated test files listed in Step 4
- `docs/agents/access-control/collection.md` (new), `docs/agents/access-control.md`, `docs/agents/access-control/stl-model.md`, `docs/agents/architecture/backend.md`

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`) — `miniatures` isn't under `games/tests/views/`, so this is the job covering it.

## Notes

- `Collection.url`'s `unique=True` + `null=True, blank=True` combination (see [plan.md](plan.md#notes)) needs a real migration-level check that Postgres treats multiple `NULL`s as non-colliding under a unique constraint (it does, by default) — no special `UniqueConstraint` needed beyond the field-level `unique=True`.
- `CollectionCreateSerializer`'s `UniqueValidator` on `url` will only fire when `url` is actually provided and non-null — confirm DRF doesn't choke on validating uniqueness against a nullable field with a blank submitted value; if it does, `url` may need `allow_null=True` explicitly in `extra_kwargs`.

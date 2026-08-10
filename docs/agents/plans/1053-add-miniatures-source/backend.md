# Backend Plan: Add miniatures source

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the four endpoints and response shapes listed in [plan.md](plan.md)'s "Shared
contracts" section. Nothing to consume from another agent.

## Implementation Steps

### Step 1 — Extend the `Source` model, add `SourcePhoto`

- `backend/miniatures/models/source.py`: add `url = models.CharField(max_length=200, blank=True,
  default='')` (plain `CharField`, no `URLField`/format validation — deliberate, per the issue)
  and `photo = models.ForeignKey('miniatures.SourcePhoto', on_delete=models.SET_NULL, null=True,
  blank=True, related_name='+')`, mirroring `StlModel.photo` exactly.
- New `backend/miniatures/models/source_photo.py`, mirroring `stl_model_photo.py`:
  ```python
  from games.models.base_photo import BasePhoto
  from .source import Source

  class SourcePhoto(BasePhoto):
      source = models.ForeignKey(Source, on_delete=models.CASCADE, related_name='photos')
  ```
- `backend/miniatures/models/__init__.py`: import/export `SourcePhoto`.
- `backend/miniatures/admin.py`: register `SourcePhoto` (import + `admin.site.register`),
  alongside the existing `Source` registration.
- New migration `backend/miniatures/migrations/0002_source_url_and_photo.py` (or similar
  auto-generated name): adds `Source.url`, creates `SourcePhoto`, adds `Source.photo` FK.
  Generate with `makemigrations`, don't hand-write field definitions.

### Step 2 — Serializers

- New `backend/miniatures/serializers/source_list.py` (`SourceListSerializer`): fields `id`,
  `name`, `photo_url` (`serializers.CharField(source='photo.path', default=None,
  read_only=True)`) — mirrors `StlModelListSerializer` exactly.
- New `backend/miniatures/serializers/source_detail.py` (`SourceDetailSerializer`): fields `id`,
  `name`, `url`, `photo_url` — mirrors `StlModelDetailSerializer`'s shape, minus `links`/`sources`/
  `tags` (a `Source` has none of those).
- New `backend/miniatures/serializers/source_create.py` (`SourceCreateSerializer`): fields
  `name` (required), `url` (optional, `required: False`). No custom `create()` needed — plain
  `ModelSerializer.create()` suffices (no tags-sync-style side effects here). `name`'s DB-level
  `unique=True` gets DRF's automatic `UniqueValidator` for free — verify this holds (it should,
  since `SourceCreateSerializer` is a `ModelSerializer` over `Source`) rather than hand-rolling a
  `validate_name`.
- Leave the existing `backend/miniatures/serializers/source.py` (`SourceSerializer`, `name` only)
  untouched — it stays the embedded, read-only shape used inside
  `StlModelDetailSerializer.sources`, per the issue's explicit scope boundary.
- `backend/miniatures/serializers/__init__.py`: register the three new serializers.

### Step 3 — Views

- New `backend/miniatures/views/sources_list.py` (`sources_list`): `GET`/`POST` on
  `/miniatures/sources.json`, mirrors `stl_models_list.py` (`IsAuthenticated` for `GET`,
  `require_staff` gate + `SourceCreateSerializer`/`validated_or_error` + `SourceDetailSerializer`
  response for `POST`, paginated `GET` via `SourceListSerializer`).
- New `backend/miniatures/views/source_detail.py` (`source_detail`): `GET` on
  `/miniatures/sources/<id>.json`, mirrors `stl_model_detail.py` (`IsAuthenticated`, 404 via
  `NOT_FOUND_RESPONSE_DATA`).
- New `backend/miniatures/views/source_photo_upload.py` (`source_photo_upload`): mirrors
  `stl_model_photo_upload.py` — `require_staff` gate, `UploadInitiator` with a deterministic
  `PhotoPathBuilder(['sources', source_id], f'photo{ext}', use_uuid=False)` path and a
  `_reuse_or_create_photo`-equivalent helper for `SourcePhoto` (reuse existing photo if
  `source.photo_id` is set, else create new).
- `backend/miniatures/views/__init__.py`: register the three new views.
- All three set `X-Skip-Cache: true` via the existing `_shared.skip_cache` helper.

### Step 4 — URLs

- New `backend/miniatures/urls/sources.py`, mirrors `stl_models.py`:
  ```python
  urlpatterns = [
      path('miniatures/sources.json', views.sources_list, name='miniatures-sources-list'),
      path('miniatures/sources/<int:source_id>.json', views.source_detail, name='miniatures-sources-detail'),
      path('miniatures/sources/<int:source_id>/photo_upload.json', views.source_photo_upload, name='miniatures-sources-photo-upload'),
  ]
  ```
- `backend/miniatures/urls/__init__.py`: concatenate `sources.urlpatterns` alongside
  `stl_models.urlpatterns`.

### Step 5 — Tests

- `backend/miniatures/tests/factories/__init__.py`: add `SourcePhotoFactory` (mirrors
  `StlModelPhotoFactory`); update `SourceFactory` if the new `url` field needs a default test
  value (optional field, so likely no change needed).
- `backend/miniatures/tests/models/source_test.py`: extend for the new `url` field (default
  blank, can be set) and the new `photo` FK (nullable, `SET_NULL` on photo delete — mirror
  `stl_model_test.py`'s equivalent photo-FK assertions).
- New `backend/miniatures/tests/models/source_photo_test.py`, mirrors `stl_model_photo_test.py`.
- New `backend/miniatures/tests/serializers/source_list_test.py`, `source_detail_test.py`,
  `source_create_test.py` — mirror the equivalent `stl_model_*_test.py` files (list shape,
  detail shape, create validation including the duplicate-`name` `400` case).
- New `backend/miniatures/tests/views/sources_list_test.py`, `source_detail_test.py`,
  `source_photo_upload_test.py` — mirror the equivalent `stl_model*_test.py` view test files:
  auth (`401`), staff-gating (`403` for non-staff `POST`), pagination, 404, and the photo-upload
  init/reuse-vs-create-photo cases.

### Step 6 — Access-control doc

Update `docs/agents/access-control/stl-model.md` (or split a new
`docs/agents/access-control/source.md` if it reads cleaner standalone — judgment call for
whoever implements this) to reflect that `Source` is no longer Django-admin-only: document its
new endpoints, permissions, and fields, matching the table in [plan.md](plan.md)'s shared
contracts section.

## Files to Change

- `backend/miniatures/models/source.py` — add `url`, `photo` fields
- `backend/miniatures/models/source_photo.py` — new
- `backend/miniatures/models/__init__.py` — register `SourcePhoto`
- `backend/miniatures/admin.py` — register `SourcePhoto`
- `backend/miniatures/migrations/0002_*.py` — new migration
- `backend/miniatures/serializers/source_list.py` — new
- `backend/miniatures/serializers/source_detail.py` — new
- `backend/miniatures/serializers/source_create.py` — new
- `backend/miniatures/serializers/__init__.py` — register new serializers
- `backend/miniatures/views/sources_list.py` — new
- `backend/miniatures/views/source_detail.py` — new
- `backend/miniatures/views/source_photo_upload.py` — new
- `backend/miniatures/views/__init__.py` — register new views
- `backend/miniatures/urls/sources.py` — new
- `backend/miniatures/urls/__init__.py` — concatenate new urlpatterns
- `backend/miniatures/tests/factories/__init__.py` — add `SourcePhotoFactory`
- `backend/miniatures/tests/models/source_test.py`, `source_photo_test.py` (new)
- `backend/miniatures/tests/serializers/source_list_test.py`, `source_detail_test.py`,
  `source_create_test.py` (all new)
- `backend/miniatures/tests/views/sources_list_test.py`, `source_detail_test.py`,
  `source_photo_upload_test.py` (all new)
- `docs/agents/access-control/stl-model.md` (or a new `source.md`) — document the new endpoints

## CI Checks

- `backend`: `cd backend && poetry run pytest --cov` (CI job: `pytest_all`) and
  `poetry run ruff check .` (CI job: `checks`)

## Notes

- `Source.name`'s existing `unique=True` should make `SourceCreateSerializer`'s duplicate-name
  `400` come for free via DRF's automatic `UniqueValidator` — confirm this with a test rather
  than assuming; if it doesn't trigger for some reason, add an explicit `validate_name`.
- Both new `GET` endpoints get real frontend callers within this same issue (see
  [frontend.md](frontend.md)), so — unlike `stl_models`' endpoints, which shipped ahead of their
  frontend (#1017/#1021) and are listed in `docs/agents/unused-endpoints.md`'s candidates
  table — `Source`'s new endpoints should **not** need an entry added there. Worth a quick sanity
  check with the doc's regeneration command before opening the PR.

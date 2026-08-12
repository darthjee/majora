# Plan: Extract photo/file upload plumbing into a dedicated uploads module

Issue: [1067-extract-photo-file-upload-plumbing-into-a-dedicated-uploads-module.md](../issues/1067-extract-photo-file-upload-plumbing-into-a-dedicated-uploads-module.md)

## Overview

Create a new, neutral `uploads` Django app and move the shared upload engine into it: the
`Upload` model, `UploadInitiator`, `PhotoPathBuilder`, the `upload_finalize` view (with its
full `_PHOTO_HANDLERS` registry, covering both photo and file handlers), and the uploads URL
module. This removes the backwards dependency where `miniatures` views import upload plumbing
from `games`. Only one specialist agent has work here (`backend`) — this is an internal
reorganization with no new endpoints, no serializer field changes, and no auth/permission
logic changes (same request/response contract throughout), so no `data-access`, `security`,
or `cache` review is required per the coordination rules. The architect handles the
documentation update directly.

## Context

Follow-up to issue #1066. That issue's "Solution" section proposed two things: extracting
upload machinery out of `games`, and inventing a new YAML-based per-entity permission scheme.
The permission scheme already exists (`backend/permissions/`), so this issue is scoped to just
the module extraction, reusing the existing permissions engine.

What moves, all currently living in `games/` despite being cross-app:
- `games/models/upload.py` — `Upload` model (3 migrations behind it: `0017_upload.py`,
  `0019_upload_content_type_upload_object_id.py`,
  `0074_upload_upload_type_gamedocumentfile.py` — the last one also creates
  `GameDocumentFile`, which stays in `games`)
- `games/views/_upload_init.py` — `UploadInitiator`
- `games/photo_path.py` — `PhotoPathBuilder`, `normalize_path_segment`
- `games/views/upload_finalize.py` — the finalize endpoint + `_PHOTO_HANDLERS` registry
- `games/urls/uploads.py` — the finalize endpoint's URL module

Both photo uploads (`CharacterPhoto`, `GameItemPhoto`, `TreasurePhoto`, `GamePhoto`,
`GameDocumentPhoto`, `GameDocumentFilePhoto`, `SourcePhoto`, `StlModelPhoto`,
`CharacterItemPhoto`) and file uploads (`GameDocumentFile`) go through the same
`_PHOTO_HANDLERS` registry in `upload_finalize.py`, so both handler kinds move together — no
photo/file split.

## Implementation Steps

### Step 1 — Scaffold the `uploads` app

Create `backend/uploads/` as a flat-file Django app (mirroring the `permissions/`/`common/`
convention for small, single-purpose apps — flat files, not `models/`/`views/` packages, since
there's only one model and one view):

- `uploads/__init__.py`
- `uploads/apps.py` — `UploadsConfig` (`name = 'uploads'`, `default_auto_field =
  'django.db.models.BigAutoField'`, matching `games/apps.py`/`miniatures/apps.py`)
- `uploads/models.py` — the `Upload` model, moved verbatim from `games/models/upload.py`,
  **plus an explicit `class Meta: db_table = 'games_upload'`** so the model keeps pointing at
  the existing DB table without any table rename (see Step 3 — this repo's app-split
  precedent, `domains/migrations/0001_initial.py`, renamed the table with `RunSQL`; this issue
  explicitly asks for *no* DB table change, so use the `db_table` override instead of that
  precedent's `RENAME TABLE` approach). Keep the `from games.settings import Settings` import
  for `upload_expiration_minutes()` — that stays a `games`-owned env-config helper, not part of
  the upload plumbing being moved.
- `uploads/admin.py` — `admin.site.register(Upload)`, moved out of `games/admin.py`.
- `uploads/photo_path.py` — `PhotoPathBuilder`, `normalize_path_segment`, moved verbatim from
  `games/photo_path.py`.
- `uploads/upload_initiator.py` — `UploadInitiator`, moved from `games/views/_upload_init.py`
  (drop the leading underscore — it's now the app's public shared API, not a private
  intra-app helper). Update its imports: `from .models import Upload`,
  `from games.serializers import PhotoUploadSerializer` (the serializer stays in `games`,
  per the issue's scope — only the engine listed above moves), and
  `from games.views.common import validated_or_error` (also stays in `games`; it's a
  general-purpose helper used across many `games` views, not upload-specific).
- `uploads/views.py` — the `upload_finalize` view + `_PHOTO_HANDLERS`/`_DEFAULT_HANDLERS`
  registry, moved from `games/views/upload_finalize.py`. Update its imports: `from .models
  import Upload`, keep `from games.models import (CharacterItemPhoto, CharacterPhoto,
  GameDocumentFile, GameDocumentFilePhoto, GameDocumentPhoto, GameItemPhoto, TreasurePhoto)`
  and `from miniatures.models import SourcePhoto, StlModelPhoto` (both apps' models are needed
  by the dispatch registry itself — this is the one place `uploads` legitimately depends back
  on `games`/`miniatures`, since the registry must know every content-object type it dispatches
  on), and `from games.views.common import check_game_edit, require_staff`.
- `uploads/urls.py` — the `uploads/(image|file)/<id>.json` `re_path`, moved from
  `games/urls/uploads.py`, pointing at `.views.upload_finalize` (flat, matching
  `staff/urls.py`'s convention for a single-route app).
- `uploads/tests/__init__.py`, `uploads/tests/models.py` or `uploads/tests/models/` — see
  Step 4 for what test content moves here.

### Step 2 — Remove the moved files from `games/`

Delete `games/models/upload.py`, `games/views/_upload_init.py`, `games/photo_path.py`,
`games/views/upload_finalize.py`, `games/urls/uploads.py`. Update:

- `games/models/__init__.py` — drop the `Upload` import/export.
- `games/views/__init__.py` — drop the `upload_finalize` import/export.
- `games/admin.py` — drop the `Upload` import and its `admin.site.register(Upload)` call.
- `games/urls/__init__.py` — drop the `uploads` import and its `+ uploads.urlpatterns` term
  from the concatenated `urlpatterns`.

### Step 3 — Register the app and wire its URLs

- `majora_project/settings.py` — add `'uploads'` to `INSTALLED_APPS` (alongside `'games'`,
  `'miniatures'`, etc.).
- `majora_project/urls.py` — add `path('', include('uploads.urls'))`, alongside the existing
  `games.urls`/`staff.urls`/`accounts.urls`/`miniatures.urls` includes, so the finalize route
  keeps resolving at the same URL (`/uploads/(image|file)/<id>.json`) after `games/urls/uploads.py`
  is removed.
- `uploads/migrations/0001_initial.py` — a `SeparateDatabaseAndState` migration whose
  `state_operations` is a single `CreateModel('Upload', ...)` reproducing the model's full
  current field set (id, `token`, `status`, `upload_type`, `file_path`, `expiration_time`,
  `user` FK, `content_type` FK, `object_id`) — i.e. the end state of `games`'s 0017 + 0019 +
  0074 migrations combined — with **empty `database_operations`** (no DB change at all; the
  `db_table` Meta override from Step 1 keeps it pointing at `games_upload`). Depends on
  `('games', '0090_move_domain_models_to_domains_app')` (or whatever is `games`'s latest
  migration at implementation time) and `contenttypes`' migration, so the referenced FKs are
  already in place.
- `games/migrations/00XX_move_upload_to_uploads_app.py` — a `SeparateDatabaseAndState`
  migration whose `state_operations` is `DeleteModel('Upload')`, with empty
  `database_operations`. Depends on `('uploads', '0001_initial')` (so the model exists in the
  new app's state before it's removed from `games`'s), following the same "add-then-remove"
  ordering used by this repo's own `domains/migrations/0001_initial.py` /
  `games/migrations/0090_move_domain_models_to_domains_app.py` precedent pair.
- Double check no other migration (in `versioning/`, etc.) declares a state dependency on
  `games.Upload` that would need reordering, the way `versioning/0023` did for the domains
  move (search `versioning/migrations/` for `historicalupload`/`Upload` references — none
  are expected, since `Upload` doesn't appear to be tracked by `simple_history`, but confirm).

### Step 4 — Update the ~13 per-entity init views' imports

Update every file below to import `UploadInitiator` from `uploads.upload_initiator` and
`PhotoPathBuilder` from `uploads.photo_path` instead of `games`'s old modules (relative imports
like `from .._upload_init import UploadInitiator` become `from uploads.upload_initiator import
UploadInitiator`; `from ...photo_path import PhotoPathBuilder` becomes `from uploads.photo_path
import PhotoPathBuilder`). No behavioral change — same request/response contract.

`games/` (leave the thin per-entity view files themselves in `games/`):
- `games/views/photo_upload.py`
- `games/views/game/_photo_upload.py`
- `games/views/game/_item_photo_upload.py`
- `games/views/games/game_document_photo_upload.py`
- `games/views/games/game_document_file_upload.py` (also uses `FileUploadSerializer` — stays
  in `games/serializers`, no change there)
- `games/views/games/game_document_file_photo_upload.py`
- `games/views/games/game_item_photo_upload.py`
- `games/views/treasures/treasure_photo_upload.py`

`miniatures/` (currently the backwards-dependency views this issue is centrally motivated by):
- `miniatures/views/source_photo_upload.py`
- `miniatures/views/stl_model_photo_upload.py`
- `miniatures/views/collection_photo_upload.py`

Also check `games/views/game/npcs/detail/game_npc_photo_upload.py`,
`games/views/game/npcs/detail/items/game_npc_item_photo_upload.py`,
`games/views/game/pcs/detail/game_pc_photo_upload.py`,
`games/views/game/pcs/detail/items/game_pc_item_photo_upload.py` and any other file under
`games/views/` importing `_upload_init`/`photo_path` not already listed above (re-grep at
implementation time — the exploration for this plan found imports funnel through
`game/_photo_upload.py`/`game/_item_photo_upload.py` for the PC/NPC cases, but confirm no
direct imports were missed).

### Step 5 — Update/relocate backend tests (~15-18 files)

Tests that unit-test the *moved* modules themselves should move alongside their code (matching
this repo's one-test-tree-per-app convention):
- `games/tests/models/upload_test.py` → `uploads/tests/models_test.py` (or
  `uploads/tests/models/upload_test.py`, matching whichever flat/nested shape Step 1 settled
  on) — update `from games.models import GamePhoto, Upload` to import `Upload` from
  `uploads.models` and `GamePhoto` from `games.models`; keep
  `from games.tests.factories import GameFactory, UserFactory` (factories stay in `games`).
- `games/tests/photo_path_test.py` → `uploads/tests/photo_path_test.py` — update `from
  games.photo_path import PhotoPathBuilder, normalize_path_segment` to `from uploads.photo_path
  import ...`.
- `games/tests/views/upload_finalize_test.py` → `uploads/tests/views_test.py` (or
  `uploads/tests/views/upload_finalize_test.py`) — update the `Upload`/photo-model imports
  accordingly (`Upload` from `uploads.models`, the photo models stay `from games.models
  import ...`).
- `games/tests/views/upload_finalize_source_test.py` → `uploads/tests/...` — same treatment
  (`Upload` from `uploads.models`, `SourcePhoto` stays `from miniatures.models`).
- `games/tests/views/upload_finalize_stl_model_test.py` → `uploads/tests/...` — same treatment.

Tests that merely *use* `Upload` as a fixture (creating one to drive some other endpoint's
test) stay where they are; only their import line changes to `from uploads.models import
Upload`:
- `games/tests/views/game/npcs/detail/game_npc_photo_upload_test.py`
- `games/tests/views/game/npcs/detail/items/game_npc_item_photo_upload_test.py`
- `games/tests/views/game/pcs/detail/game_pc_photo_upload_test.py`
- `games/tests/views/game/pcs/detail/items/game_pc_item_photo_upload_test.py`
- `games/tests/views/games/game_document_file_photo_upload_test.py`
- `games/tests/views/games/game_document_file_upload_test.py`
- `games/tests/views/games/game_document_photo_upload_test.py`
- `games/tests/views/games/game_item_photo_upload_test.py`
- `games/tests/views/photo_upload_test.py`
- `games/tests/views/treasures/treasure_photo_upload_test.py`
- `miniatures/tests/views/collection_photo_upload_test.py`
- `miniatures/tests/views/source_photo_upload_test.py`
- `miniatures/tests/views/stl_model_photo_upload_test.py`

Re-grep at implementation time for `from games.models import Upload` /
`from games.photo_path import` / `from games.views._upload_init import` /
`from games.views.upload_finalize import` across `backend/` to make sure this list is
exhaustive (the exploration for this plan found the above via `grep -rl` but a fresh pass
should confirm nothing new landed since).

### Step 6 — Run the full backend test suite

```bash
docker-compose run backend poetry run pytest
```

All tests must pass, including the moved/relocated ones. Also run migrations to confirm the
new `SeparateDatabaseAndState` pair applies cleanly against an existing DB state:

```bash
docker-compose run backend poetry run python manage.py migrate
docker-compose run backend poetry run python manage.py makemigrations --check --dry-run
```

(the second command should report no missing migrations — confirming the `Upload` model's
final state in `uploads` matches what the migrations produce).

### Step 7 — Documentation (architect, not backend)

- `docs/agents/architecture/backend.md` — add a `## uploads/` section (alongside the existing
  `## games/`, `## miniatures/` sections) describing the new app and its ownership of the
  shared upload engine (`Upload` model, `UploadInitiator`, `PhotoPathBuilder`,
  `upload_finalize`), and trim the `## games/` section's description if it references upload
  internals.
- `docs/agents/unused-endpoints.md` — update the `PATCH /uploads/(image|file)/<id>.json` row's
  "Owning app" column from `games` (`games.views.upload_finalize`) to `uploads`
  (`uploads.views.upload_finalize`).
- Scan `docs/agents/` for any other reference to `games/models/upload.py`,
  `games/views/_upload_init.py`, `games/photo_path.py`, `games/views/upload_finalize.py`, or
  `games/urls/uploads.py` and update it to the new `uploads` app path.

## Files to Change

- `backend/uploads/__init__.py`, `apps.py`, `models.py`, `admin.py`, `photo_path.py`,
  `upload_initiator.py`, `views.py`, `urls.py`, `migrations/0001_initial.py` — new.
- `backend/uploads/tests/` — new (relocated tests, see Step 5).
- `backend/games/models/upload.py`, `backend/games/views/_upload_init.py`,
  `backend/games/photo_path.py`, `backend/games/views/upload_finalize.py`,
  `backend/games/urls/uploads.py` — deleted.
- `backend/games/models/__init__.py`, `backend/games/views/__init__.py`,
  `backend/games/admin.py`, `backend/games/urls/__init__.py` — drop moved-out imports/exports.
- `backend/games/migrations/00XX_move_upload_to_uploads_app.py` — new (state-only `DeleteModel`).
- `backend/majora_project/settings.py` — add `'uploads'` to `INSTALLED_APPS`.
- `backend/majora_project/urls.py` — add `path('', include('uploads.urls'))`.
- The ~13 per-entity init views listed in Step 4 — import path updates only.
- The ~15-18 test files listed in Step 5 — import path updates, 5 of them relocated.
- `docs/agents/architecture/backend.md`, `docs/agents/unused-endpoints.md` — doc updates
  (architect).

## CI Checks

- `backend`: `docker-compose run backend poetry run pytest` (CI jobs: `pytest_views_characters`
  runs `games/tests/views/game/`, `pytest_views_rest` runs `games/tests/views/` excluding
  `games/tests/views/game/`, `pytest_all` runs everything else via `--ignore=games/tests/views/`
  — no CI config change is needed: these are directory-based `--ignore` patterns with no
  explicit file list, so tests relocated into `uploads/tests/` are automatically picked up by
  `pytest_all`).

## Notes

- No new API endpoint, no serializer field changes, and no auth/permission logic changes — the
  `/uploads/(image|file)/<id>.json` route and all init endpoints keep their exact
  request/response contract. Per the coordination rules this means `data-access`, `security`,
  and `cache` review are **not** required for this issue.
- The `uploads` app ends up depending back on `games` (`games.serializers.PhotoUploadSerializer`,
  `games.views.common.{validated_or_error,check_game_edit,require_staff}`,
  `games.settings.Settings`, several `games.models` photo/file classes) and on `miniatures`
  (`SourcePhoto`, `StlModelPhoto`) for the finalize dispatch registry. This is intentional and
  matches the issue's explicit scope (the registry must know every content-object type it
  dispatches on) — the backwards dependency this issue actually removes is `miniatures`
  importing `games`'s *internal* upload modules, not all cross-app imports in general.
  Flag to the backend agent that this two-way dependency is expected, not a regression, if it
  gives them pause.
- Follow this repo's own precedent for a state-only app-split migration pair:
  `domains/migrations/0001_initial.py` (`uploads`'s equivalent "add" migration) and
  `games/migrations/0090_move_domain_models_to_domains_app.py` (`games`'s equivalent "remove"
  migration) — but note that precedent renamed the underlying table via `RunSQL`, whereas this
  issue explicitly asks to leave the DB table untouched, so use an explicit `db_table =
  'games_upload'` Meta override on the new `Upload` model instead of a `RENAME TABLE` operation.
- Confirm at implementation time whether `Upload` needs an explicit `app_label` anywhere (e.g.
  in `ContentType` lookups keyed by `app_label`/`model` — `Upload` uses `GenericForeignKey` as
  the *source* side, not the target, of the generic relation, so this is unlikely to matter, but
  worth a quick grep for `content_type__app_label='games'` or similar hardcoded lookups against
  `Upload` itself, as opposed to its various target photo/file models).

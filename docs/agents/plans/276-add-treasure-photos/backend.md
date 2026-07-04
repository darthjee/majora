# Backend Plan: Add treasure photos

Main plan: [plan.md](plan.md)

## Shared contracts

- Must produce: `POST /treasures/<int:treasure_id>/photo_upload.json`, superuser-only,
  returning `{'upload_id': ..., 'token': ..., 'treasure_id': ...}` on success (201).
- Must produce: `photo_path` field on `TreasureListSerializer` and
  `TreasureDetailSerializer` (`source='photo.path', default=None, read_only=True`).
- Must extend `upload_finalize.py` so `TreasurePhoto` uploads are permission-checked
  and finalized correctly (frontend relies on the existing submit/finalize
  endpoints working unchanged for treasure photos too).

## Implementation Steps

### Step 1 — `TreasurePhoto` model + `Treasure.photo` FK

- Add `source/games/models/treasure_photo.py`:
  ```python
  class TreasurePhoto(models.Model):
      treasure = models.ForeignKey(Treasure, on_delete=models.CASCADE, related_name='photos')
      path = models.CharField(max_length=512, blank=True, default='')
      ready = models.BooleanField(default=False)
  ```
  (mirrors `CharacterPhoto`/`GamePhoto`; `__str__` returns `self.path`).
- Add `photo = models.ForeignKey('TreasurePhoto', on_delete=models.SET_NULL, null=True, blank=True, related_name='+')`
  to `Treasure` (`source/games/models/treasure.py`), matching
  `Game.cover_photo`/`Character.profile_photo`.
- Register both in `source/games/models/__init__.py` (`__all__` too).
- Generate the migration (`CreateModel(TreasurePhoto)` + `AddField(treasure, photo)`)
  via `docker-compose run --rm majora_tests poetry run python manage.py makemigrations games`
  — do not hand-write it; follow the shape of
  `0027_characterphoto_character_profile_photo_delete_photo.py` for reference only.
- Add `source/games/tests/models/test_treasure_photo.py` mirroring
  `test_game_photo.py` (creation, `__str__`, `treasure.photos` related name,
  deleting the photo clears `Treasure.photo`).

### Step 2 — Upload-init view

- Add `source/games/views/treasures/treasure_photo_upload.py`:
  - `get_object_or_404(Treasure, pk=treasure_id)`.
  - `TreasureEditPermission.check(request, treasure)` (superuser-only, already
    exists in `source/games/permissions.py` — no new permission class needed).
  - Validate `filename` via the existing `PhotoUploadSerializer`.
  - Path is always `photos/treasures/<treasure_id>/photo.<ext>` — no UUID (unlike
    `_build_file_path` in `photo_upload.py`/`_photo_upload.py`, which randomize
    the stem). Use `os.path.splitext(filename)` for the extension only.
  - If `treasure.photo_id` is set, reuse that `TreasurePhoto` row: update its
    `path`, set `ready=False`, save. Otherwise `TreasurePhoto.objects.create(...)`.
  - Create the `Upload` row, set `upload.content_object` to the `TreasurePhoto`,
    save.
  - Return `Response({'upload_id': upload.id, 'token': upload.token, 'treasure_id': treasure.id}, status=201)`.
- Register the view in `source/games/views/treasures/__init__.py`,
  `source/games/views/__init__.py`, and add the URL to `source/games/urls.py`:
  `path('treasures/<int:treasure_id>/photo_upload.json', views.treasure_photo_upload, name='treasure-photo-upload')`
  near the other treasure routes.
- Add `source/games/tests/views/treasures/treasure_photo_upload_test.py` mirroring
  `game_pc_photo_upload_test.py` / `photo_upload_test.py`: covers 401 unauthenticated,
  403 non-superuser, 201 first upload (creates a `TreasurePhoto`), and 201
  re-upload (reuses the same `TreasurePhoto` row, updates `path`, does not create
  a second row).

### Step 3 — Extend `upload_finalize.py`

- In `_check_permission` (`source/games/views/upload_finalize.py`), add a branch:
  `if isinstance(content_object, TreasurePhoto): return TreasureEditPermission.check(request, content_object.treasure)`
  before the existing `CharacterPhoto` check (order doesn't matter as long as
  each type is checked before the generic `else` game branch).
- In `_mark_content_object_ready`, add a `TreasurePhoto` branch that always sets
  `treasure.photo = content_object` (no "if unset" guard — a treasure's photo is
  always fully replaced): add a `_set_treasure_photo(treasure_photo)` helper
  mirroring `_set_profile_photo_if_unset`/`_set_cover_photo_if_unset` but without
  the `is None` condition.
- Extend `source/games/tests/views/upload_finalize_test.py` (or add a focused
  new test file) covering: finalizing a `TreasurePhoto` upload sets
  `treasure.photo`, and re-uploading a second time correctly replaces it (no
  "if unset" guard skipping the update), and permission checks (403 for
  non-superuser, 401 unauthenticated) route through `TreasureEditPermission`.

### Step 4 — Serializers

- Add `photo_path = serializers.CharField(source='photo.path', default=None, read_only=True)`
  to `TreasureListSerializer` and `TreasureDetailSerializer`
  (`source/games/serializers/treasure_list.py`, `treasure_detail.py`), and add
  `'photo_path'` to each `Meta.fields`.
- Update `source/games/tests/serializers/test_treasure_list.py` and
  `test_treasure_detail.py` to assert `photo_path` is `None` with no photo and
  the path string once a `TreasurePhoto` is attached.
- Do **not** add `photo_path` to `TreasureCreateSerializer`/`TreasureUpdateSerializer`
  (write serializers) — a treasure's photo is only ever set through the upload
  lifecycle, never via direct field assignment (same mass-assignment rule
  documented in issue #273 / `docs/agents/access-control.md`).

### Step 5 — Documentation

- Update `docs/agents/access-control.md`'s "Treasure" section: add `photo_path`
  to the "Exposed fields (read)" line, and add a row to the permissions table
  for `POST /treasures/<id>/photo_upload.json` — "Superuser only — unauthenticated
  → 401, authenticated non-superuser → 403", matching the existing
  create/update rows.

## Files to Change

- `source/games/models/treasure_photo.py` — new `TreasurePhoto` model
- `source/games/models/treasure.py` — add `photo` FK
- `source/games/models/__init__.py` — register `TreasurePhoto`
- `source/games/migrations/00XX_*.py` — generated migration
- `source/games/views/treasures/treasure_photo_upload.py` — new upload-init view
- `source/games/views/treasures/__init__.py` — export the new view
- `source/games/views/__init__.py` — export the new view
- `source/games/urls.py` — register `treasures/<id>/photo_upload.json`
- `source/games/views/upload_finalize.py` — add `TreasurePhoto` branch to
  `_check_permission` and `_mark_content_object_ready`
- `source/games/serializers/treasure_list.py` — add `photo_path`
- `source/games/serializers/treasure_detail.py` — add `photo_path`
- `source/games/tests/models/test_treasure_photo.py` — new
- `source/games/tests/views/treasures/treasure_photo_upload_test.py` — new
- `source/games/tests/views/upload_finalize_test.py` — extend for `TreasurePhoto`
- `source/games/tests/serializers/test_treasure_list.py` — extend
- `source/games/tests/serializers/test_treasure_detail.py` — extend
- `docs/agents/access-control.md` — document the new field and endpoint

## CI Checks

- `source`: `poetry run pytest games/tests/` (CI job: `pytest_views` / `pytest_all`), `poetry run ruff check .` and `bin/reports.sh ci` (CI job: `checks`)
- Run via: `docker-compose run --rm majora_tests poetry run pytest games/tests/`

## Notes

- `TreasureEditPermission` already exists in `source/games/permissions.py` — no
  new permission class is needed, only new call sites.
- Re-uploading with a different extension leaves the old file in storage
  (explicitly out of scope per the issue) — no cleanup logic needed.
- Follow the mass-assignment rule from issue #273: `photo`/`photo_path` must
  never be writable through `TreasureUpdateSerializer`/`TreasureCreateSerializer`.

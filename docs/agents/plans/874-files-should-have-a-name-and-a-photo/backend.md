# Backend Plan: Files should have a name and a Photo

Main plan: [plan.md](plan.md)

## Shared contracts

- `POST /games/:game_slug/documents/:id/file_upload.json` accepts an
  optional `name` field in the request body, alongside the existing
  `filename` field. When `name` is blank/omitted, `GameDocumentFile.name`
  is set from `filename` instead.
- Response shape is unchanged.

## Implementation Steps

### Step 1 — Add `name` to `BaseFile`

Edit `backend/games/models/base_file.py`: add
`name = models.CharField(max_length=255, blank=True, default='')`, alongside
the existing `path`/`ready` fields (this is the one attribute from the
issue's "common interface" that actually lives on the abstract base — the
photo relation does not, see Step 2).

### Step 2 — Add `GameDocumentFilePhoto` and the `photo` relation

Add `backend/games/models/game/game_document_file_photo.py`:

```python
"""GameDocumentFilePhoto model for Majora RPG Campaign Management System."""

from games.models.base_photo import BasePhoto


class GameDocumentFilePhoto(BasePhoto):
    """Model representing the single photo associated with a game document file."""
```

No FK back to `GameDocumentFile` on this model — unlike `GameDocumentPhoto`
(which is FK'd *from* the photo, supporting many photos per document), this
is a dedicated 1:1 photo, owned the other way round, exactly like
`Game.cover_photo`/`Character.profile_photo`:

Edit `backend/games/models/game/game_document_file.py` to add:

```python
photo = models.ForeignKey(
    'games.GameDocumentFilePhoto', on_delete=models.SET_NULL, null=True, blank=True,
    related_name='+',
)
```

(`null=True`/`blank=True` since photo upload isn't implemented yet — every
existing and new `GameDocumentFile` will have `photo=None` for now.)

Register the new model in `backend/games/models/__init__.py` (import +
`__all__`), following the existing `GameDocumentPhoto` entry right above/below
`GameDocumentFile`'s.

### Step 3 — Migration: schema + backfill

Run `poetry run python manage.py makemigrations games` to generate the
schema migration (new `name` field, new `GameDocumentFilePhoto` model, new
`photo` FK). Then add a **second**, data-only migration (`RunPython`) in the
same PR that backfills `name` for existing `GameDocumentFile` rows from
`path`.

`path` is `<folder/path>/<original_file_name>_<uuid4>.<extension>` (see
`backend/games/photo_path.py`'s `PhotoPathBuilder.build`, which always
appends `_<uuid4>` to the filename stem for file uploads —
`use_uuid=True` in `game_document_file_upload.py`). Extract
`original_file_name` by:
1. Taking `os.path.basename(path)`.
2. Splitting off the extension (`os.path.splitext`).
3. Stripping a trailing `_<uuid4>` suffix from the stem via a regex, e.g.
   `re.sub(r'_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', '', stem, flags=re.IGNORECASE)`.
4. Re-appending the extension to form `name` (e.g. `scroll.pdf`, matching
   what the user would recognize as the original file name).

Rows with an empty `path` (shouldn't normally happen, but `path` is
`blank=True`) should get `name=''`, not raise.

### Step 4 — Accept `name` on the upload-init endpoint

Edit `backend/games/serializers/photo_upload.py`'s `FileUploadSerializer`
to add an optional field:

```python
name = serializers.CharField(max_length=255, allow_blank=True, required=False, default='')
```

(Left off the shared `PhotoUploadSerializer` base — the plain photo-upload
endpoints don't have a name concept.)

`UploadInitiator.run()` (`backend/games/views/_upload_init.py`) currently
calls `self._create_photo(file_path)`, passing only the derived file path.
Extend this to also pass the full `serializer.validated_data`:

```python
photo = self._create_photo(file_path, serializer.validated_data)
```

This changes the shared `create_photo` callback contract used by **all**
upload-init views, so every existing caller's lambda needs an extra
(ignorable) parameter:
- `backend/games/views/photo_upload.py`
- `backend/games/views/game/_item_photo_upload.py`
- `backend/games/views/game/_photo_upload.py`
- `backend/games/views/treasures/treasure_photo_upload.py`
- `backend/games/views/games/game_item_photo_upload.py`
- `backend/games/views/games/game_document_photo_upload.py`

e.g. `create_photo=lambda file_path, _data: GamePhoto.objects.create(...)`
(underscore-prefixed, unused) — no behavior change for these.

In `backend/games/views/games/game_document_file_upload.py`, update the
`create_photo` lambda to use the new `name`, falling back to `filename`:

```python
create_photo=lambda file_path, data: GameDocumentFile.objects.create(
    game_document=document, path=file_path, ready=False,
    name=data.get('name') or data['filename'],
),
```

### Step 5 — Tests

- `backend/games/tests/models/game/` — add a model test for
  `GameDocumentFilePhoto` (mirrors `game_document_photo_test.py`), plus a
  `GameDocumentFile.photo` relation test (create with/without a photo,
  `on_delete=SET_NULL` behavior when the photo is deleted).
- `backend/games/tests/views/games/game_document_file_upload_test.py` —
  add cases: `name` provided is saved as-is; `name` omitted/blank falls back
  to `filename`; `name` respects `max_length` (400 on a too-long value, if
  DRF's `CharField` enforces it — confirm via a test).
- Add a migration test (or a small script run manually + reviewed) verifying
  the backfill regex against representative `path` values, including a
  `original_file_name` that itself contains underscores (e.g.
  `my_scroll_v2_<uuid4>.pdf` -> `my_scroll_v2.pdf`), to make sure only the
  trailing UUID segment is stripped.

## Files to Change

- `backend/games/models/base_file.py` — add `name`
- `backend/games/models/game/game_document_file.py` — add `photo` FK
- `backend/games/models/game/game_document_file_photo.py` — new model
- `backend/games/models/__init__.py` — register `GameDocumentFilePhoto`
- `backend/games/migrations/00XX_*.py` — schema migration (generated)
- `backend/games/migrations/00XX_*_backfill_file_name.py` — data migration
- `backend/games/serializers/photo_upload.py` — `FileUploadSerializer.name`
- `backend/games/views/_upload_init.py` — pass `validated_data` to `create_photo`
- `backend/games/views/photo_upload.py` — lambda signature (unused param)
- `backend/games/views/game/_item_photo_upload.py` — lambda signature (unused param)
- `backend/games/views/game/_photo_upload.py` — lambda signature (unused param)
- `backend/games/views/treasures/treasure_photo_upload.py` — lambda signature (unused param)
- `backend/games/views/games/game_item_photo_upload.py` — lambda signature (unused param)
- `backend/games/views/games/game_document_photo_upload.py` — lambda signature (unused param)
- `backend/games/views/games/game_document_file_upload.py` — use `name`/fallback
- `backend/games/tests/models/game/game_document_file_photo_test.py` — new
- `backend/games/tests/views/games/game_document_file_upload_test.py` — extend

## CI Checks

- `backend/`: `poetry run pytest games/tests/views/` (CI job: `pytest_views_rest`/`pytest_views_characters`)
- `backend/`: `poetry run pytest --ignore=games/tests/views/` (CI job: `pytest_all`)
- `backend/`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- Confirm `poetry run python manage.py makemigrations --check` doesn't flag
  drift after both migrations are added.
- The `UploadInitiator` contract change (Step 4) is the riskiest part of
  this plan purely because of its blast radius (6 unrelated upload views
  touched for an unused parameter) — keep that diff mechanical and re-run
  the full view test suite, not just the file-upload tests, to catch any
  missed lambda.

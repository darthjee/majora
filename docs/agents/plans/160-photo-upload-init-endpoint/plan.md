# Plan: Add endpoint to start game photo upload

Issue: [160-photo-upload-init-endpoint.md](../issues/160-photo-upload-init-endpoint.md)

## Overview

Add `POST /games/<game_slug>/photo_upload.json` — the first step in the game photo upload
flow. The endpoint creates an `Upload` record and a `GamePhoto` record (with `path` and
`ready` fields that must be added to the model first), then returns the upload `id` and
`token` to the client. No frontend work is required; this is a pure backend change.

## Context

Issue #127 (game photo upload flow) requires a server-side initialisation endpoint. The
`Upload` model was added in #159. This issue adds the two new fields to `GamePhoto` and
the endpoint that wires everything together.

## Implementation Steps

### Step 1 — Extend the `GamePhoto` model

Add two fields to `source/games/models/game_photo.py`:

- `path = models.CharField(max_length=512, blank=True, default='')` — stores the
  pre-computed relative file path (`photos/games/<game_slug>/<name>_<uuid>.<ext>`).
- `ready = models.BooleanField(default=False)` — set to `True` once the upload is
  finalised; `False` during initialisation and while uploading.

### Step 2 — Generate and apply the migration

Run `python manage.py makemigrations` inside the `backend` service to produce
`0018_gamephoto_path_ready.py` (name may vary). Verify the migration is correct and
applies cleanly with `python manage.py migrate`.

### Step 3 — Add the `photo_upload` view

Create `source/games/views/photo_upload.py` with a function-based view:

```
POST /games/<game_slug>/photo_upload.json
```

Logic:
1. Retrieve the `Game` by `game_slug` (404 if not found).
2. Call `GameEditPermission.check(request, game)` — return the error response if it is not
   `None`.
3. Extract `filename` from `request.data`. Return 400 if missing or empty.
4. Split the extension from `filename` using `os.path.splitext`.
5. Generate a random UUID (`uuid.uuid4()`).
6. Build the file path: `photos/games/<game_slug>/<stem>_<uuid><ext>`.
7. Create an `Upload` record: `user=request.user`, `file_path=<path>`. Token and
   expiration are set automatically by `Upload.save()`.
8. Create a `GamePhoto` record: `game=game`, `path=<path>`, `ready=False`. The `url`
   field is left empty for now (it will be populated when the upload is finalised in #161).
9. Return HTTP 201 with `{ "id": upload.id, "token": upload.token }`.

Use the same decorator pattern as other authenticated views (`@api_view(['POST'])`,
`@authentication_classes([TokenAuthentication])`, `@permission_classes([AllowAny])`).

### Step 4 — Register the URL

Add to `source/games/urls.py`:

```python
path(
    'games/<slug:game_slug>/photo_upload.json',
    views.photo_upload,
    name='game-photo-upload',
),
```

### Step 5 — Export from the views package

Add `photo_upload` to the imports and `__all__` list in
`source/games/views/__init__.py`.

### Step 6 — Write tests

Create `source/games/tests/views/photo_upload_test.py` covering:

- **401** — unauthenticated request returns 401.
- **403** — authenticated user who is not a game master (nor superuser) of the game
  returns 403.
- **404** — unknown `game_slug` returns 404.
- **400** — missing or blank `filename` body field returns 400.
- **201 (happy path)** — authenticated game editor sends a valid filename; response
  contains `id` (int) and `token` (non-empty string); an `Upload` record exists in the DB
  with `status=pending` and `file_path` containing the slug, stem, and extension; a
  `GamePhoto` record exists with the same `path` and `ready=False`.

Follow the existing test patterns in `source/games/tests/views/games_test.py` (pytest
classes, `@pytest.mark.django_db`, DRF `Token` authentication headers).

## Files to Change

- `source/games/models/game_photo.py` — add `path` and `ready` fields
- `source/games/migrations/0018_gamephoto_path_ready.py` — new migration (generated)
- `source/games/views/photo_upload.py` — new view file
- `source/games/views/__init__.py` — export `photo_upload`
- `source/games/urls.py` — register the new URL
- `source/games/tests/views/photo_upload_test.py` — new test file

## CI Checks

- `source/`: `docker-compose run backend poetry run pytest` (CI job: `pytest`)

## Notes

- The `url` field on `GamePhoto` is currently `URLField` (required, no default). To avoid
  a `NOT NULL` constraint violation when creating a `GamePhoto` during initialisation,
  either make `url` nullable/blank or provide an empty default. The cleanest approach is
  to make it `blank=True, default=''` and add a separate migration — or simply provide an
  empty string when creating the record in the view. Confirm which approach is consistent
  with the existing data before writing the migration.
- File path format (`photos/games/<game_slug>/<stem>_<uuid><ext>`) is defined by the
  issue; confirm it matches what the proxy/storage layer expects (relevant for #161).
- The `Upload` model's token and expiration are set automatically in `Upload.save()`;
  no manual assignment is needed in the view.

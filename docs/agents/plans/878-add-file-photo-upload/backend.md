# Backend Plan: Add file photo upload

Main plan: [plan.md](plan.md)

## Shared contracts

- New endpoint `POST /games/:game_slug/documents/:document_id/files/:file_id/photo_upload.json` (name `game-document-file-photo-upload`), returning `201 { upload_id, token, upload_type: "image", file_id }`. See [plan.md](plan.md)'s "New endpoint: file photo upload" for the exact permission/serializer/behavior contract.
- **Required change to the existing `file_upload.json` endpoint's response**: it must also expose the newly created `GameDocumentFile`'s own id, so the frontend can build the URL above. See [plan.md](plan.md)'s "Frontend chained-upload sequencing" for why `id_value` alone can't carry this and the suggested fix (add the created object's `pk` to `UploadInitiator._create_upload_response`'s payload, e.g. under a new `id` key).

## Implementation Steps

### Step 1 — Extend `UploadInitiator` to expose the created object's id

In `backend/games/views/_upload_init.py`, update `_create_upload_response` to also include the created object's own primary key in the response, e.g.:

```python
return Response(
    {
        'upload_id': upload.id,
        'token': upload.token,
        'upload_type': upload.upload_type,
        'id': photo.pk,
        self._id_field: self._id_value,
    },
    status=201,
)
```

This is additive and safe for every existing caller of `UploadInitiator` (`game_item_photo_upload`, `game_document_photo_upload`, `game_document_file_upload`, character item photo upload, treasure photo upload, etc.) — none of them currently read/assert on the response body missing an `id` key, but confirm by checking existing tests for that assumption before finalizing the key name (avoid colliding with anything already asserted).

### Step 2 — Add `GameDocumentFilePhotoUploadPermission`

In `backend/games/permissions.py`, add a new permission class right after `GameDocumentFileUploadPermission`, mirroring it exactly (same `_is_allowed`: `user.is_staff or game.has_player(user) or game.can_be_edited_by(user)`).

### Step 3 — Add the `game_document_file_photo_upload` view

New file `backend/games/views/games/game_document_file_photo_upload.py`, modeled directly on `backend/games/views/games/game_item_photo_upload.py`:

- Signature: `game_document_file_photo_upload(request, game_slug, document_id, file_id)`.
- `game = get_object_or_404(Game, game_slug=game_slug)`.
- `document = get_object_or_404(GameDocument, pk=document_id, game=game)`.
- `file = get_object_or_404(GameDocumentFile, pk=file_id, game_document=document)`.
- Permission check via the new `GameDocumentFilePhotoUploadPermission.check(request, game)`.
- `UploadInitiator(request, build_file_path=..., create_photo=lambda file_path, _data: _reuse_or_create_photo(file, file_path), id_field='file_id', id_value=file.id)` — default `serializer_class`/`upload_type` (image), no `name` field needed.
- `_build_file_path`: deterministic, no UUID (a file has at most one photo, always replaced) — segments `['games', game_slug, 'documents', document_id, 'files', file_id]`, filename `f'photo{ext}'`, matching `game_item_photo_upload.py`'s `_build_file_path` pattern via `PhotoPathBuilder(..., use_uuid=False)`.
- `_reuse_or_create_photo(file, file_path)`: if `file.photo_id is not None`, update `file.photo.path`/`ready=False` and save; else `GameDocumentFilePhoto.objects.create(path=file_path, ready=False)` and assign it to `file.photo` (save `file`) — check whether `GameDocumentFile.photo` needs an explicit reverse accessor update/save here (its FK is `related_name='+'`, `on_delete=SET_NULL`, so unlike `GameItem`'s `photo` FK there's no back-reference concern, but `file.photo = photo; file.save(update_fields=['photo'])` is still required after creating a new photo, since `GameDocumentFilePhoto` doesn't itself hold the FK to the file — `GameDocumentFile.photo` is the FK).

### Step 4 — Register the view and URL

- `backend/games/views/games/__init__.py`: import and export `game_document_file_photo_upload`.
- `backend/games/views/__init__.py`: import and export `game_document_file_photo_upload`.
- `backend/games/urls/games.py`: add, right after the existing `game-document-file-upload` route:

```python
path(
    'games/<slug:game_slug>/documents/<int:document_id>/files/<int:file_id>/photo_upload.json',
    views.game_document_file_photo_upload,
    name='game-document-file-photo-upload',
),
```

### Step 5 — Apply Step 1's response change to `game_document_file_upload`

No code change needed in `game_document_file_upload.py` itself beyond what Step 1 already provides generically (the created `GameDocumentFile`'s `pk` will now automatically appear as `id` in its init response, since `create_photo` already returns the created file). Update/extend `backend/games/tests/views/games/game_document_file_upload_test.py` to assert the response now includes `id` matching the created file's id.

### Step 6 — Tests

- New `backend/games/tests/views/games/game_document_file_photo_upload_test.py`, mirroring `game_item_photo_upload_test.py` and `game_document_file_upload_test.py`: covers success (create new photo when file has none), reuse/replace (file already has a photo), 404s for wrong game/document/file, and permission checks for each of dm/admin/player/staff (allowed) plus a non-player/non-staff user (denied) — follow whatever role-parametrization pattern `game_item_photo_upload_test.py` already uses.
- `backend/games/tests/views/_upload_init_test.py` (or wherever `UploadInitiator` itself is unit-tested, if it exists) — add/extend a case asserting the response now includes the created object's `id`.

## Files to Change

- `backend/games/views/_upload_init.py` — include the created object's `pk` in the init response.
- `backend/games/permissions.py` — add `GameDocumentFilePhotoUploadPermission`.
- `backend/games/views/games/game_document_file_photo_upload.py` — new view (create + reuse-or-create photo logic).
- `backend/games/views/games/__init__.py`, `backend/games/views/__init__.py` — register the new view.
- `backend/games/urls/games.py` — add the new route.
- `backend/games/tests/views/games/game_document_file_photo_upload_test.py` — new tests.
- `backend/games/tests/views/games/game_document_file_upload_test.py` — extend for the new `id` field in the response.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --cov ...` (job `pytest_views_rest`, or wherever `games/tests/views/games/` falls in the sharding) and `poetry run pytest --cov ...` (job `pytest_all`) — run via `docker-compose run --rm backend poetry run pytest`.
- `backend`: `poetry run ruff check .` (job `checks`).

## Notes

- Double-check `GameDocumentFile.photo`'s `related_name='+'` doesn't block reading `file.photo` back after assignment in the same request — it shouldn't (that only disables the reverse accessor on `GameDocumentFilePhoto`, not forward access via `file.photo`).
- Confirm no existing test/consumer of any `UploadInitiator`-based endpoint asserts an exact/closed set of response keys (which would break with the new `id` key) before landing Step 1.

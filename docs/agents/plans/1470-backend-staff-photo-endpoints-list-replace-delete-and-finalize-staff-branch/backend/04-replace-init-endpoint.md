# Replace init endpoint

`POST /staff/photos/<str:photo_type>/<int:photo_id>/replace.json` (`staff_photo_replace`):

1. `require_staff` first; then registry lookup (unknown slug → 404) and `get_object_or_404(entry.model, pk=photo_id)`.
2. Validate payload with `PhotoUploadSerializer` (only `filename`); errors → 400 via `validated_or_error`.
3. `photo.path` empty → **422** `{"errors": {"path": ["photo_path_missing"]}}`.
4. Active upload for this photo → **409** (e.g. `{"errors": {"upload": ["replace_in_progress"]}}`).
5. New path = stem of `photo.path` (`os.path.splitext`) + **lowercased** extension of the validated filename (client stem ignored). Same extension → same path.
6. Create the `Upload` with `origin='staff'`, `file_path=<new path>`, `upload_type=image`, `content_object=photo`; **do not touch** `photo.path` / `photo.ready`.
7. Respond **201** `{upload_id, token, upload_type, id: photo.pk, photo_type}`.

Reuse `UploadInitiator` only if it can be cleanly parameterised (it creates/updates the photo via `create_photo` and doesn't set `origin`); otherwise build the `Upload` directly in the view, mirroring `UploadInitiator._create_upload_response`'s response shape. Wrap the active-upload check + create in a transaction with `select_for_update()` on the photo row to avoid two concurrent inits both passing the 409 check.

Tests (parametrized over registry entries for the happy path): 401/403 (before slug/id resolution), 404 unknown slug / unknown id / id of another type, 400 bad extension, 422 empty path, 409 active upload, expired leftover upload doesn't block, same-extension → same path, `.JPG`→`.jpg` same path, `.png`→`.jpg` new path under same stem, `photo.path`/`ready` unchanged after init, `Upload.origin == 'staff'`, `X-Skip-Cache: true`.

## Files to Change

- `backend/staff/views/staff_photo_replace.py` — new view.
- `backend/staff/views/__init__.py`, `backend/staff/urls.py` — wiring.
- `backend/staff/tests/staff_photo_replace_test.py` — tests.

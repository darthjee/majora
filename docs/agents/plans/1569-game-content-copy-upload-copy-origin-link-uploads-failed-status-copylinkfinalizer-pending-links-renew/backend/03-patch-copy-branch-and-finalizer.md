# PATCH copy branch and CopyLinkFinalizer

Add `backend/uploads/copy_link_finalizer.py` with `CopyLinkFinalizer`, which mirrors `StaffUploadFinalizer`:

- `check_permission(request)`: returns `require_staff(request)`. This **replaces** the per-type check.
- `apply(new_status, data)`, run inside `transaction.atomic()`:
  - `uploading`: save the status and return `200 {file_path, source_path}`.
  - `failed`: validate `data['error']` against `Upload.ERROR_CHOICES`. A missing or invalid value returns `400 {'errors': {'error': ['invalid_error']}}` and leaves the row unchanged. Otherwise set `status=failed` and `error`, save, and return `200`.
  - `uploaded`: save the status, then lock the copied row (`select_for_update`, as `StaffUploadFinalizer._locked_photo` does) and set `ready=True`. When `upload.is_cover` is set, call `copy_links.find_for_model(model).set_cover(row)`. The per-type `_PHOTO_HANDLERS` `mark_ready` handlers are skipped. Return `200` with `attach_cache_clear(response, entry.cache_paths(row, upload))`.

Changes in `backend/uploads/views.py`:
- `_validate_upload`: add `upload.status == Upload.STATUS_FAILED` to the uniform-`403` group, next to the `uploaded` check. A failed upload accepts no `PATCH` until it is renewed, and the response does not leak the status.
- `_check_permission`: add the `is_copy_origin` branch that delegates to `CopyLinkFinalizer(upload).check_permission(request)`. It still runs before the `upload_type` `404`.
- Status validation: keep `_VALID_STATUSES` for regular and staff uploads. Copy uploads also accept `failed`. `failed` on a non-copy upload returns `400 invalid_status`, as today.
- Dispatch `is_copy_origin` to `CopyLinkFinalizer(upload).apply(new_status, request.data)`, alongside the staff dispatch.

Tests (`backend/uploads/tests/views_finalize_copy_test.py`, using a copy upload on a `GameItemPhoto` and on a `GameDocumentFile`):
- start returns both paths;
- `uploaded` sets `ready`, and sets the owner `photo` only when `is_cover`;
- per-type handlers are skipped (the item `photo` is unchanged when `is_cover` is false);
- `X-Cache-Clear` comes from the hook (patch the entry to return paths, and expect no header by default);
- `failed` with a valid error from `pending` and from `uploading`;
- `failed` without an error, or with an unknown error, returns `400`;
- `failed` on a regular upload returns `400`;
- a `PATCH` on a failed upload returns `403`;
- staff gate: non-staff gets `403`, and a staff member who is not a game editor succeeds;
- no-leak ordering: a non-staff caller with a wrong `upload_type` gets `403`, not `404`;
- the token, user and expiry checks still apply;
- the existing regular and staff finalize tests are unchanged.

## Files to Change
- `backend/uploads/copy_link_finalizer.py` — new finalizer.
- `backend/uploads/views.py` — copy branch in validation, permission, status set and dispatch.
- `backend/uploads/tests/views_finalize_copy_test.py` — new tests.

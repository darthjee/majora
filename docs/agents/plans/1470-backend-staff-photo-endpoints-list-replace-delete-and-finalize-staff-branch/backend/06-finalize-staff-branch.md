# Finalize staff branch

Change `backend/uploads/views.py` so `origin='staff'` uploads take a staff path; `origin='regular'` keeps today's behaviour byte-for-byte.

- **Content object gone** (photo row deleted while in flight): for staff uploads, respond **404** `{"cleanup_path": upload.file_path}` (path from the `Upload` row, never the request) — before any permission check that would dereference the content object. Regular uploads keep current behaviour.
- **Authorization:** `_check_permission` → for staff uploads, `require_staff(request)` instead of the `_PHOTO_HANDLERS` permission check. Token / owning-user / expiry / not-already-uploaded checks unchanged.
- `pending → uploading`: unchanged (`{file_path}`).
- **`uploaded` for staff uploads:** in `transaction.atomic()`, re-fetch the photo with `select_for_update()`, `old_path = photo.path`, set `photo.path = upload.file_path`, `ready = True`, save; **skip** `mark_ready` handlers. Respond **200** `{"previous_path": old_path}` only if `old_path` and `old_path != upload.file_path`; otherwise 200 with no body.
- Keep the upload status save + photo update consistent (same transaction).

Tests (`backend/uploads/tests/views_finalize_staff_test.py`):

- staff user finalizes staff upload for a photo they couldn't game-edit → 200; non-staff (e.g. demoted) → 403; other staff user (not `upload.user`) → 403; bad token / expired → 403.
- same path → 200 no body, `path` unchanged, `ready=True`; extension change → `previous_path` returned and `path` updated; never-ready photo → `previous_path` still returned when different.
- `mark_ready` skipped: replacing an orphan `TreasurePhoto` doesn't re-point `treasure.photo`.
- owner deleted mid-flight → 404 `{cleanup_path}`.
- Regression: existing `views_finalize_test.py` and per-type finalize tests pass unchanged.

## Files to Change

- `backend/uploads/views.py` — staff branch.
- `backend/uploads/tests/views_finalize_staff_test.py` — new tests.

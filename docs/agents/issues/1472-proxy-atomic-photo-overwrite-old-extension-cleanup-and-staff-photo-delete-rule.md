# Issue: Proxy: atomic photo overwrite, old-extension cleanup and staff photo delete rule

## Description
Part of #1468 (staff page to manage photos). The Tent proxy is the only component that handles file bytes: `UploadHandler` writes uploaded files, and `DeleteHandler` runs photo deletion (backend `deletable.json` → delete the file via `SecurePhotoStorage` → backend `DELETE`). Today `DeleteHandler` only covers character photos (`DELETE /games/:slug/(pcs|npcs)/:id/photos/:photo_id.json`).

This issue adapts the proxy to the staff photo contract delivered by #1470:

- `POST /staff/photos/<photo_type>/<photo_id>/replace.json` creates an `Upload` (`origin='staff'`) for an **existing** photo. Its `file_path` keeps the current path stem, so the same extension gives the **same path** as the current file.
- `PATCH /uploads/image/<id>.json` → `uploaded` (finalize) for staff uploads:
  - **200** with `{"previous_path": "<old path>"}` only when the old path was non-empty and differs from the new one (extension changed, compared lowercased). Otherwise 200 with no body. When the path changed, the response also carries `X-Cache-Clear` for the owner's cached paths.
  - **404** with `{"cleanup_path": "<path>"}` when the photo row was deleted mid-replace.
- `GET /staff/photos/<photo_type>/<photo_id>/deletable.json` → 200 `{deletable, path}` / 404 / 422 (replace in flight), and `DELETE /staff/photos/<photo_type>/<photo_id>.json` → 204 with `X-Cache-Clear` / 422. Both are gated by `require_staff`.

Cache invalidation via `X-Cache-Clear` (#1469) is already merged: `UploadHandler` and `DeleteHandler` clear the listed paths and strip the header.

## Problem
- `UploadHandler` writes the file straight to its target path. With in-place overwrites, a client can read a half-written photo, and a failed write can corrupt the existing file.
- When a staff replace changes the extension, the old file stays on the photos volume.
- When the photo is deleted mid-replace, the file the proxy just wrote stays on the volume.
- `DELETE /staff/photos/<type>/<id>.json` currently goes through the generic `default_proxy` rule (with `ResponseCacheClearMiddleware`). It deletes the database record and clears the cache, but **never deletes the file**.

## Expected Behavior
### 1. Atomic in-place overwrite
- `UploadHandler` writes the upload to a **temporary file in the target directory, then renames it over the target**. An overwrite never exposes a half-written file, and a failed write leaves the old file intact.
- Path validation (`SecurePhotoStorage`, `UploadContentValidator`, `UploadFilenameValidator`) still applies.

### 2. Old-extension cleanup (`previous_path`)
- When the finalize response is a 200 with `previous_path`, the proxy deletes that file through `SecurePhotoStorage` (guarded against path traversal). A missing file counts as already deleted.
- The existing `X-Cache-Clear` handling on finalize keeps working.
- `previous_path` never reaches the client. `UploadHandler` already builds its response from scratch, so keep it that way.

### 3. Owner deleted mid-replace (`cleanup_path`)
- Only on the **finalize** (`uploaded`) call: a 404 with `{"cleanup_path": ...}` makes the proxy delete that file through `SecurePhotoStorage` (missing file = already deleted), then forward the 404.
- A 404 from the `uploading` call is forwarded as-is. Nothing has been written yet, so no file is deleted.

### 4. Staff delete rule
- New proxy rule for `DELETE /staff/photos/<photo_type>/<photo_id>.json` that uses the `DeleteHandler` orchestration. Generalize `DeleteHandler` as needed to derive the `deletable.json` / `DELETE` backend URLs from the request path. Add the rule to both `dev_configuration` and `prod_configuration`, ahead of the generic `default_proxy` `.json` rule.
- Authorization relies on the backend (`deletable.json` and `DELETE` both enforce `require_staff`). No `StaffAccessGuard` round-trip, same as the existing `DeleteHandler`.
- Non-200 `deletable.json` responses (401/403/404/422) are forwarded as-is, and no file is deleted.
- A missing file on disk counts as already deleted, and the record is still deleted.
- The `DELETE` response's `X-Cache-Clear` is honored and stripped, as `DeleteHandler` already does.
- The existing character-photo `DELETE` route keeps working unchanged.

### Out of scope / accepted limitations
- `/photos/*` cache revalidation headers: done in #1471.
- If finalize fails after the file is written (any error other than the 404 with `cleanup_path`), the written file is not rolled back. For a same-path replace, the photo already serves the new bytes. For a changed extension, the new file is left orphaned. This is accepted.

## Notes
- Specialists: `proxy` implements it; `security` reviews it (file overwrite and deletion driven by backend-supplied paths).
- Backend contract references: `backend/uploads/staff_upload_finalizer.py`, `backend/staff/views/staff_photo_deletable.py`, `backend/staff/staff_photo_deleter.py`.

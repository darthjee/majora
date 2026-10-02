# Finalize body: previous_path and cleanup_path
Make the finalize (`status=uploaded`) result usable by `UploadHandler`, and act on it.

**UploadStatusClient**
- Change `requestUploadedStatus` to expose the response body as well as the headers. For example, return the full result array (`httpCode`, `headers`, `body`), or a small value object with `headers()` and `previousPath()`.
- On a **404 whose JSON body has a non-empty string `cleanup_path`**, surface it to the caller, e.g. via a dedicated `UploadCleanupRequiredException` carrying the path, the code and the original body. Every other non-200 keeps throwing `BackendErrorException` unchanged.
- `requestUploadingStatus` stays as is. A 404 there (with or without `cleanup_path`) is a plain `BackendErrorException`, forwarded as-is with no file deletion.

**UploadHandler**
- After a 200 finalize: clear caches from the headers (existing behavior), then, if the body has a non-empty string `previous_path`, delete it with `SecurePhotoStorage` rooted at the upload type's base path (images → `photosBasePath`). Skip the delete when `previous_path` equals the path just written (defensive). A missing file is a no-op (`deleteFile` already ignores it). If the delete throws `InvalidArgumentException` (traversal), log it and still return the 200 success response: the upload itself succeeded and the DB already points at the new file.
- On the cleanup exception: delete `cleanup_path` through `SecurePhotoStorage` (missing file = already deleted; a traversal attempt is logged and skipped), then forward the backend's 404 and body to the client.
- The client response stays built from scratch (`{"file_path": ...}`), so `previous_path` never leaks.

Tests:
- `UploadStatusClientTest`: 200 with/without `previous_path`; 404 with `cleanup_path` → cleanup exception; 404 without it → `BackendErrorException`; non-JSON 404 body → `BackendErrorException`.
- `UploadHandlerTest`:
  - 200 + `previous_path` deletes the old-extension file and keeps the new one.
  - 200 without it deletes nothing.
  - 200 + `previous_path` pointing at a missing file still returns 200.
  - `previous_path` with `../` traversal deletes nothing outside the base and still returns 200.
  - finalize 404 + `cleanup_path` deletes the written file and forwards 404.
  - `uploading` 404 + `cleanup_path` deletes nothing and forwards 404.
  - `X-Cache-Clear` on finalize is still cleared and not forwarded.

## Files to Change
- `proxy/extension/lib/support/UploadStatusClient.php` — expose the finalize body; detect 404 `cleanup_path`.
- `proxy/extension/lib/exceptions/UploadCleanupRequiredException.php` (new, name indicative) — carries `cleanup_path` plus the backend 404 response.
- `proxy/extension/lib/handlers/UploadHandler.php` — delete `previous_path` / `cleanup_path` via `SecurePhotoStorage`; update the docblocks.
- `proxy/extension/loader.php` — require the new exception file, if the loader lists files explicitly.
- `proxy/extension/tests/support/UploadStatusClientTest.php`, `proxy/extension/tests/handlers/UploadHandlerTest.php` — cases above.

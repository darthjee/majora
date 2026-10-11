# LinkHandler
Create `Tent\RequestHandlers\LinkHandler` for `POST /uploads/link/<image|file>/<id>/submit`. Follow `UploadHandler`'s structure: the `build()` params are `host`, `photos_path`, `files_path` and `cache_path`, where `cache_path` is the cache **root** and always uses `ResponseCacheClearer::forRoot()`.

Flow in `processsRequest()`:
1. Parse type and id with `#^/uploads/link/(image|file)/(\d+)/submit$#`. A mismatch → `400`.
2. `StaffAccessGuard::requireStaffAccess($client, $headers)`. A `BackendErrorException` is relayed with its code and body.
3. `requestLinkStartStatus()` → `{file_path, source_path}`. A `BackendErrorException` is relayed as-is.
4. Resolve the type root: `image` → `<photos_path>/photos`, `file` → `<files_path>/files`. Both `source_path` and `file_path` must start with the matching prefix (`photos/` or `files/`), else `path_rejected`.
5. Validate the source (absolute path `<base>/<source_path>`):
   - missing (`!file_exists` and `!is_link`) → `source_missing`;
   - `is_link` or `!is_file` → `path_rejected`;
   - `PathTraversalGuard::assertRealPathWithinBase($typeRoot, $source)` failure → `path_rejected`.
6. Validate the target (absolute path `<base>/<file_path>`): `new SecurePhotoStorage($typeRoot)` and `ensureDirectoryFor($target)`. An `InvalidArgumentException` → `path_rejected`; a mkdir failure → `permission`.
7. If the target exists:
   - not a symlink and the same inode as the source (`fileinode`, plus the same device via `stat`) → idempotent retry: skip linking;
   - otherwise (any other file, or a symlink) → `target_exists`.
8. Otherwise call `link($source, $target)`, never `symlink()` and never a copy. On failure, map `error_get_last()`: "cross-device" → `cross_device`, "Permission denied" → `permission`, "File exists" → `target_exists`, anything else → `unknown`.
9. Finalize with `requestUploadedStatus()`, then `cacheClearer->clearFrom($finalize->headers(), 200)`. A finalize `BackendErrorException` (e.g. `404` when the copied row is gone) is relayed. Do **not** unlink the new link: copies are resumable and nothing is auto-deleted.
10. Success → `200 {"status":"uploaded"}`.

On any failure in steps 4–8:
- call `requestFailedStatus($id, $code, $headers)`;
- log the code with the upload id, but no paths;
- answer `422 {"status":"failed","error":"<code>"}`.

If the failed PATCH itself throws, log it and still answer the `422`. No response body or header ever contains `file_path`, `source_path` or `X-Cache-Clear`.

Register the class in `proxy/extension/loader.php`, after `UploadHandler.php`.

## Files to Change
- `proxy/extension/lib/handlers/LinkHandler.php` — new handler.
- `proxy/extension/loader.php` — `require_once` the handler.
- `proxy/extension/tests/handlers/LinkHandlerTest.php` — tests (fake HTTP client plus temp dirs, as in `UploadHandlerTest`):
  - a non-staff caller gets `403` and no PATCH is sent;
  - backend `403`/`404` on link start are relayed;
  - a bad prefix on either end → `path_rejected`;
  - a missing source → `source_missing`;
  - a symlinked source → `path_rejected`;
  - a source escaping the root via a symlinked dir → `path_rejected`;
  - a target escaping via `..` → `path_rejected`;
  - success creates a hard link (same inode, `is_link` false) and finalizes;
  - same-inode retry skips `link()` and finalizes;
  - a different existing target, or a symlink target → `target_exists`;
  - each failure sends `status=failed` with its code;
  - finalize `404` is relayed;
  - cross-domain cache clear after finalize;
  - responses never contain paths or `X-Cache-Clear`.

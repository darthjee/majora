# Proxy Plan: Proxy: atomic photo overwrite, old-extension cleanup and staff photo delete rule

Main plan: [plan.md](plan.md)

## Overview
All changes live in `proxy/`. The backend contract (#1470) and `X-Cache-Clear` handling (#1469) are already merged. This plan only adds file-level behavior and one routing rule.

## Context
- `UploadStorageResolver::write` currently does `file_put_contents($destination, ...)` straight onto the target.
- `UploadStatusClient::requestUploadedStatus` throws `BackendErrorException` on any non-200 and returns only the headers, so the finalize body (`previous_path`) is dropped today.
- Staff finalize contract (`backend/uploads/staff_upload_finalizer.py`): 200 + optional `{"previous_path"}` (+ `X-Cache-Clear` when the path changed); 404 + `{"cleanup_path"}` when the photo row is gone. The same 404 can also come from the `uploading` call, which must be forwarded as-is without any file deletion.
- `DeleteHandler` hard-codes the character path regex and URL builders. `DELETE /staff/photos/...` currently falls through to `default_proxy` in `rules/backend.php`, which deletes the record but leaves the file.
- Staff `deletable.json` returns 200 `{deletable, path}` (same shape as the character endpoint), 404, or 422. Both staff endpoints enforce `require_staff` (401/403).

## Steps

- [01 — Atomic upload write](proxy/01-atomic-upload-write.md)
- [02 — Finalize body: previous_path and cleanup_path](proxy/02-finalize-previous-and-cleanup-path.md)
- [03 — Generalize DeleteHandler and add the staff delete rule](proxy/03-staff-delete-rule.md)
- [04 — Update the proxy architecture doc](proxy/04-update-proxy-doc.md)

## CI Checks
- `proxy`: `vendor/bin/phpcs --standard=proxy/phpcs.xml proxy` (CI job: proxy lint)
- `proxy`: `vendor/bin/phpunit --bootstrap /var/www/html/extension/tests/bootstrap.php /var/www/html/extension/tests` (CI job: proxy tests)
- Run both inside the proxy container through `docker-compose`, never on the host.

## Notes
- `security` should review the change: it deletes and overwrites files using backend-supplied paths. Every deletion must go through `SecurePhotoStorage::deleteFile` (traversal guard + realpath check), never a raw `unlink`.
- Accepted limitation (per the issue): a finalize failure other than the 404 with `cleanup_path` does not roll back the written file.
- Keep the existing character-photo `DELETE` tests green and unchanged in behavior.

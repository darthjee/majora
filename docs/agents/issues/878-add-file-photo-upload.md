# Issue: Add file photo upload

## Description
Similar to a `GameItem`, a `GameDocumentFile` has a single Photo (`GameDocumentFilePhoto`). The `GameDocumentFilePhoto` model and the `photo` FK on `GameDocumentFile` already exist (added in #874), but there is no way to actually upload a photo for a file yet.

## Problem
There is no `GameDocumentFilePhoto` upload flow. The file-creation modal only creates the file (name + file), with no way to attach a photo at the same time.

## Solution
Add an optional photo upload to the existing file-creation flow. Uploading or replacing a photo on a file that already exists is out of scope for this issue (may be addressed later).

### Affected page
- `/#/games/:game_slug/documents/:id`

### UI elements order in the modal
- Name
- File to be uploaded
- Photo to be uploaded (optional)

### Saga
- Creates the file at `POST /games/:game_slug/documents/:id/files.json`
- Start File Upload `POST /games/:game_slug/documents/:id/files/:id/file_upload.json`
- Submit File Upload `POST /uploads/:upload_type/:id/submit.json`
- if photo is present in the form
  - Start Photo Upload `POST /games/:game_slug/documents/:id/files/:id/photo_upload.json`
  - Submit Photo Upload `POST /uploads/:upload_type/:id/submit.json`
- Reload page data

### New endpoint `POST /games/:game_slug/documents/:id/files/:id/photo_upload.json`
Similar to every other photo upload (e.g. `GameItem`'s `items/:item_id/photo_upload.json`), but tied to the file: reuses the file's existing photo if it already has one, or creates a new `GameDocumentFilePhoto` otherwise, following the same `UploadInitiator` pattern.

Available for:
- dm
- admin
- player
- staff

### Cache cleanup
There is currently no `documents.php` cache-cleanup config at `proxy/extension/lib/configuration/cache_cleanup/` (unlike `items.php`, `npcs.php`, `pcs.php`, `sessions.php`, `treasures.php`), so no document route clears cache today. Add `documents.php` (registered in `cache_cleanup_map.php` alongside the others) covering the whole documents family, not just this issue's new routes, mirroring the breadth of `items.php`:

Targets (list/detail views to clear):
- `/games/:game_slug/documents.json`
- `/games/:game_slug/documents/all.json`
- `/games/:game_slug/documents/:document_id.json`
- `/games/:game_slug/documents/:document_id/full.json`
- `/games/:game_slug/documents/:document_id/photos.json`
- `/games/:game_slug/documents/:document_id/photos/all.json`
- `/games/:game_slug/documents/:document_id/files.json`
- `/games/:game_slug/documents/:document_id/files/all.json`

Routes (mutating requests that trigger the cleanup above):
- `/games/:game_slug/documents/:document_id.json`
- `/games/:game_slug/documents/:document_id/photo_upload.json`
- `/games/:game_slug/documents/:document_id/file_upload.json`
- `/games/:game_slug/documents/:document_id/photos/:photo_id/set.json`
- `/games/:game_slug/documents/:document_id/files/:file_id/photo_upload.json` (new, this issue)

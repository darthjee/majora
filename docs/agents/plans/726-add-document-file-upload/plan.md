# Plan: Add document file upload

Issue: [726-add-document-file-upload.md](../../issues/726-add-document-file-upload.md)

## Overview

Introduce a second upload kind (`file`, PDF-only) alongside the existing `image` uploads, scoped initially to `GameDocument`. This requires: a new `upload_type` field on `Upload` (backend), a route change adding `:upload_type` to the shared submit/finalize endpoints (backend + proxy + frontend, coordinated deploy), a generalized proxy `UploadHandler` with per-type validation strategies (proxy), a new `GameDocumentFile`/`BaseFile` model plus a `file_upload` init endpoint mirroring the existing photo-upload endpoint (backend), a new files storage root parallel to `photos` (infra), and a file-upload button/modal on the document page (frontend), with matching i18n entries (translator).

## Agents involved

- [backend](backend.md)
- [proxy](proxy.md)
- [infra](infra.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### `Upload.upload_type` field
- New field on `backend/games/models/upload.py`'s `Upload` model: `upload_type = models.CharField(max_length=10, choices=[('image', 'image'), ('file', 'file')], default='image')`.
- Existing rows backfill to `'image'` via the migration's default.
- Set explicitly at creation time in `UploadInitiator.run()` (backend) based on which init view created it — `game_document_photo_upload` (and other existing photo-upload views) keep the default `'image'`; the new `game_document_file_upload` view creates it with `'file'`.

### Route shape (breaking change — coordinated deploy required)
- Submit (proxy-facing, called by frontend): `POST /uploads/:upload_type/:id/submit.json` (was `POST /uploads/:id/submit.json`).
- Finalize (backend-facing, called by proxy internally): `PATCH /uploads/:upload_type/:id.json` (was `PATCH /uploads/:id.json`).
- Backend's finalize view must 404 if the URL's `:upload_type` doesn't match the `Upload` row's stored `upload_type`.
- Only one frontend call site references the old submit path today (`frontend/assets/js/client/UploadClient.js`), so frontend churn is contained to that file plus its caller (`PhotoUploadModalController.js`).
- Proxy's `PhotoUploadHandler` id-extraction regex changes from `^/uploads/(\d+)/submit$` to capture the type segment too: `^/uploads/([a-z]+)/(\d+)/submit$`. The existing proxy rule matcher (`method=POST, uri begins_with '/uploads/'`) does not need to change — `/uploads/image/5/submit` and `/uploads/file/5/submit` both still match that prefix.

### Init-endpoint response contract
- Both `POST .../photo_upload.json` and the new `POST .../file_upload.json` now include `upload_type` in their JSON response, alongside the existing upload id/token fields, so the frontend knows which `:upload_type` segment to use when building the submit URL.

### New model: `GameDocumentFile`
- `backend/games/models/base_file.py`: new abstract `BaseFile` model, mirroring `BasePhoto` (`path`, `ready`, `HistoricalRecords`).
- `backend/games/models/game/game_document_file.py`: `GameDocumentFile(BaseFile)` with `game_document = models.ForeignKey(GameDocument, on_delete=models.CASCADE, related_name='files')`.
- Storage path root: `files/games/:game_slug/documents/:id/<file_name>_<uuid>.<extension>` (parallel to photos' `photos/...` root) — requires `PhotoPathBuilder.build()` to accept a `root` param (default `'photos'`) instead of hardcoding it.

### Proxy validation strategy per type
- Image: current MIME allow-list (`image/jpeg|png|gif|webp`) + extension allow-list (`jpg,jpeg,png,gif,webp`).
- File: MIME `application/pdf` + extension `pdf` only.
- Storage base path: images keep the current `photosBasePath` (`photos_path` proxy config); files use a new sibling `filesBasePath` (`files_path` proxy config), set up by infra.

## Suggested build order

1. **infra**: add the `files` docker-compose volume, CircleCI `link_files` job, and confirm the prod file-storage location with backend/proxy so the proxy rule's `location` can be finalized. This unblocks proxy's local dev testing.
2. **backend**: model/migration, serializer, views, urls, permission, `upload_finalize` registry entry, `PhotoPathBuilder` root param — this is the contract the other agents build against.
3. **proxy**: generalize `PhotoUploadHandler` → `UploadHandler` with per-type strategies, add `files.php` rule, wire `files_path` param.
4. **frontend**: new file-upload button/modal on the document page, `UploadClient`/`documentConfig` changes to pass `upload_type` through.
5. **translator**: add `file_upload_modal` i18n keys once frontend has settled on the final key names.

Backend and proxy can proceed in parallel once the shared contract above is fixed; frontend depends on backend's response shape (`upload_type` in the init response) and can stub against it if backend isn't finished yet.

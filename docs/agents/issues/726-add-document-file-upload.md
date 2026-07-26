# Issue: Add document file upload

## Description
`GameDocument` currently has a collection of photos, but should also support a collection of files. A document represents an actual document in the game, which could be stored as a collection of photos, a PDF, or both.

### Current implementation
The browser performs 2 requests to upload a photo:
- `POST .../photo_upload.json` — creates an upload request and the photo (not ready yet), defines the photo path.
- `POST /uploads/:uuid/submit.json` — goes through the upload proxy rule (`proxy/prod_configuration/rules/uploads.php` / `proxy/dev_configuration/rules/uploads.php`), then `PhotoUploadHandler` (`proxy/extension/lib/handlers/PhotoUploadHandler.php`), which validates the photo upload object, stores the image file, and marks the upload as ready.

The proxy handler (`proxy/extension/lib/handlers/PhotoUploadHandler.php`) validates image type, validates access, fetches upload information (containing the file path), stores the image, and updates the upload status.

Backend endpoints:
- `POST .../photo_upload.json` — starts the process, returns the upload information needed.
- `POST /upload/:uuid.json` — updates the upload status and returns the file path.

### Infra
- Deployment: `.circleci/config.yml:362-376` has a job to link the `photos` folder.
- Proxy production: `proxy/prod_configuration/configure.php` includes `proxy/prod_configuration/rules/photos.php`.
- Proxy development: `proxy/dev_configuration/configure.php` includes `proxy/dev_configuration/rules/photos.php`.
- docker-compose: `docker-compose.yml:101` configures the photos folder.

## Problem
There is no file upload mechanism yet, only photo upload.

## Expected Behavior
Players, DMs, admins and staff can attach PDF files (not just photos) to a `GameDocument`, via a file upload button/modal on the document page, mirroring the existing photo upload flow.

## Solution
Introduce the first file upload strategy, alongside the existing photo upload strategy. This changes the URL shape of the existing photo upload submit/finalize routes (adding `:upload_type`), so proxy, backend, and frontend need to be deployed together; only one frontend call site references the current path (`UploadClient.js`), so churn is low.

### Infra
#### Deployment
`.circleci/config.yml:362-376` has a job to link the `photos` folder; we need a similar job for `files`, running in parallel, and the `release` job needs to depend on this new job too.

#### Proxy
- Production: `proxy/prod_configuration/configure.php` includes `proxy/prod_configuration/rules/photos.php`; we need a similar configuration for files in `proxy/prod_configuration/rules/files.php`.
- Development: `proxy/dev_configuration/configure.php` includes `proxy/dev_configuration/rules/photos.php`; we need a similar configuration for files in `proxy/dev_configuration/rules/files.php`.

#### docker-compose
Add, in `docker-compose.yml:101`, the configuration for the files folder, just like photos.

### Model
Update the upload model to add an `upload_type` (`image` or `file`). This is used by the upload handler to know which code and validation to run. Current entries in the database should all default to `image`.

Introduce a `DocumentFile` entity for the game document's file collection, mirroring the existing photo model structure: today `GameDocumentPhoto` extends a shared `BasePhoto` model. Similarly, add a shared `BaseFile` model and a `GameDocumentFile(BaseFile)` with a `game_document` FK (`related_name='files'`), so the file model layer stays consistent with the photo model layer.

### UI
On page `/#/games/:game_slug/documents/:id`:
- Add a button for file upload at the top, next to the "back" button.
- Clicking the button opens a file upload modal (similar to the photo upload modal).
- Clicking send triggers:
  - `POST /games/:game_slug/documents/:id/file_upload.json`
  - `PATCH /uploads/:upload_type/:uuid.json`

### Frontend Requests
- `POST .../photo_upload.json` now also returns the `upload_type`, to be used in the submit request.
- `POST .../file_upload.json` similarly returns its `upload_type` (`file`), to be used in the submit request.
- `POST /uploads/:uuid/submit.json` moves to `POST /uploads/:upload_type/:uuid/submit.json`.

### Proxy handler
Rename `PhotoUploadHandler` (`proxy/extension/lib/handlers/PhotoUploadHandler.php`) to a single generic `UploadHandler`, and refactor it into a strategy-based structure:
- The common orchestration (upload id/type extraction, requesting `uploading`/`uploaded` status from the backend, header filtering) stays in `UploadHandler` and is shared across upload types.
- Type-specific behavior (validation, storage base path) is extracted into small per-type strategies selected by `upload_type`.
- Image upload type: runs the current image validation code (existing MIME/extension allow-list).
- File upload type: runs similar validation to image; for now only `.pdf` is accepted.

### Backend Endpoints
- Existing photo upload endpoints need to include `upload_type` in the response.
- `PATCH /uploads/:uuid.json` moves to `PATCH /uploads/:upload_type/:uuid.json`, and adds `upload_type` filtering so that sending the wrong `upload_type` returns 404.
- New file upload endpoint `POST /games/:game_slug/documents/:id/file_upload.json`, similar to `POST .../photo_upload.json`, but:
  - Generates a `DocumentFile` entity.
  - Generates an `Upload` with upload type `file`.
  - Permitted for dm, admin, staff and player.
  - Uses `X-Cache-Skip`.
  - Generates the path similar to the NPC photo path (e.g. `/photos/games/:game_slug/characters/:id/photos/<file_name>_<uuid>.<extension>`), as `/files/games/:game_slug/documents/:id/<file_name>_<uuid>.<extension>`.

## Benefits
`GameDocument` can represent real in-game documents that are PDFs (not only scanned photos), matching how documents actually exist in the game.

# Proxy Plan: Add document file upload

Main plan: [plan.md](plan.md)

## Shared contracts

- Submit route becomes `POST /uploads/:upload_type/:id/submit.json` (was `POST /uploads/:id/submit.json`). The existing rule matcher (`method=POST, uri begins_with '/uploads/'`) does not need to change.
- The handler must forward the same `:upload_type` when it internally calls backend's finalize endpoint, now `PATCH /uploads/:upload_type/:id.json`.
- Per-type validation: image keeps the current MIME/extension allow-list; file (pdf) validates MIME `application/pdf` + extension `pdf` only.
- Storage base path: image uploads keep using `photos_path`; file uploads use a new `files_path` proxy config param (infra provides the actual mount).

## Implementation Steps

### Step 1 — Rename `PhotoUploadHandler` to `UploadHandler`
Rename `proxy/extension/lib/handlers/PhotoUploadHandler.php` → `proxy/extension/lib/handlers/UploadHandler.php`, class `Tent\RequestHandlers\PhotoUploadHandler` → `Tent\RequestHandlers\UploadHandler`. Update the `class` reference in both `proxy/prod_configuration/rules/uploads.php` and `proxy/dev_configuration/rules/uploads.php`.

### Step 2 — Parse `upload_type` from the URL
In `extractUploadId()` (regex-based), change the pattern from `#^/uploads/(\d+)/submit$#` to capture both segments, e.g. `#^/uploads/([a-z]+)/(\d+)/submit$#`, and split it into two accessors: the existing upload-id extraction, plus a new `extractUploadType()` (or return both from one method). Reject (422/400) if the type segment isn't `image` or `file`.

### Step 3 — Per-type validation strategy
Replace the hardcoded `imageRejectionReason()` (MIME allow-list `image/jpeg|png|gif|webp` + `UploadFilenameValidator`) with a small per-type dispatch. Two reasonable shapes — pick whichever keeps the diff smallest:
- **Minimal**: keep `imageRejectionReason()` as-is, add a sibling `fileRejectionReason()` (MIME `application/pdf`, extension `pdf`), and a `rejectionReasonFor(string $uploadType, ?array $file)` that dispatches between them.
- **Strategy objects** (only if the minimal version gets unwieldy): introduce an `UploadTypeStrategy` interface with `allowedMimeTypes()`/`allowedExtensions()`/`basePath()`, with `ImageUploadStrategy`/`PdfUploadStrategy` implementations, selected via a small factory keyed by `upload_type`.

`UploadFilenameValidator` (`proxy/extension/lib/support/UploadFilenameValidator.php`) currently hardcodes `ALLOWED_EXTENSIONS` as a class constant — change it to accept the allowed-extensions list via constructor (or a static method taking a list param), so both image and pdf validation can reuse the same double-extension-rejection logic.

### Step 4 — Per-type storage base path
`UploadHandler::build()` currently reads `$params['photos_path']` into `$this->photosBasePath`. Add `$params['files_path']` similarly (into e.g. `$this->filesBasePath`), and have `writePhotoFile()` (or a renamed `writeUploadedFile()`) pick the base path based on `upload_type`. `SecurePhotoStorage` itself needs no change — it's already generic over any base path.

### Step 5 — Forward `upload_type` to backend finalize calls
`requestUploadingStatus()`/`requestUploadedStatus()` (→ `updateStatus()`) currently PATCH `{host}/uploads/{id}.json`. Change the URL built there to `{host}/uploads/{upload_type}/{id}.json`, using the type parsed in Step 2.

### Step 6 — Wire `files.php` proxy rule
Create `proxy/prod_configuration/rules/files.php` and `proxy/dev_configuration/rules/files.php`, copying `photos.php` in each directory but with `uri => '/files'` and `location` pointing at the files-equivalent path. Confirm with infra where prod files should physically live (prod `photos.php`'s `location` is `/home/moria_user/moria.ffavs.net` — same root as photos, so files likely need clarification on the exact subpath; coordinate with the infra agent's plan before finalizing this file).

Add `require_once __DIR__ . '/rules/files.php';` to both `proxy/dev_configuration/configure.php` and `proxy/prod_configuration/configure.php`, right after the existing `rules/photos.php` require (matching the "photos before uploads/backend, redirects last" ordering).

Update `proxy/prod_configuration/rules/uploads.php` / `proxy/dev_configuration/rules/uploads.php` to also pass `'files_path' => $filesPath` (prod) / `'files_path' => '/var/www/html'` (dev, mirroring how `photos_path` is set today) into the `UploadHandler` build params.

### Step 7 — Tests
Update `proxy/extension/tests/handlers/PhotoUploadHandlerTest.php` (rename to `UploadHandlerTest.php`):
- Update all existing URL-building test helpers to include an `upload_type` segment (default `image` for pre-existing test cases).
- Change `testInvalidFileTypeReturnsUnprocessableEntity` (currently asserts a `.pdf` upload is rejected) — split into: an `image`-type PDF upload still rejected, and a new `file`-type PDF upload accepted; add a new case for a `file`-type non-PDF upload being rejected.
- Add coverage for the finalize PATCH URL now including `upload_type`.
- No changes expected to `SecurePhotoStorageTest.php`. `UploadFilenameValidatorTest.php` needs updates if its constructor signature changes (Step 3).

## Files to Change
- `proxy/extension/lib/handlers/PhotoUploadHandler.php` → `proxy/extension/lib/handlers/UploadHandler.php` (rename + refactor).
- `proxy/extension/lib/support/UploadFilenameValidator.php` — parametrize allowed extensions.
- `proxy/prod_configuration/rules/uploads.php`, `proxy/dev_configuration/rules/uploads.php` — class rename, `files_path` param.
- `proxy/prod_configuration/rules/files.php`, `proxy/dev_configuration/rules/files.php` — new files.
- `proxy/prod_configuration/configure.php`, `proxy/dev_configuration/configure.php` — add `files.php` require.
- `proxy/extension/tests/handlers/PhotoUploadHandlerTest.php` → `UploadHandlerTest.php`.
- `proxy/extension/tests/support/UploadFilenameValidatorTest.php` — update if signature changes.

## CI Checks
- `proxy`: PHPUnit (CI job(s) covering `proxy/extension` — check `.circleci/config.yml` for the exact job name/command before running, e.g. likely something under a `proxy`/`phpunit` job).

## Notes
- This is a breaking change to the currently-working photo upload flow; do not deploy independently of the backend and frontend changes (URL shape must match on all three sides simultaneously).
- The prod `files.php` rule's `location` needs infra/ops input on where files should physically be stored in production — flag this explicitly rather than guessing a path.

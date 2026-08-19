# Issue: Split UploadHandler.php into single-responsibility classes (PHPMD TooManyMethods)

## Description

Sub-issue of #1193.

Codacy's PHPMD `codesize` ruleset flags `proxy/extension/lib/handlers/UploadHandler.php` (554 lines, complexity 77 — the 5th highest complexity in the repo) with `TooManyMethods`: the class has 16 non-getter/setter methods.

## Problem

`UploadHandler` currently mixes several distinct responsibilities in one class:

- request parsing (`extractUploadIdentifiers`)
- upload content validation (`rejectionReasonFor`, `imageRejectionReason`, `fileRejectionReason`, `detectedMimeType`, `hasPdfMagicBytes`, called from `validateUploadedFile`)
- upload-status polling against the backend (`requestUploadingStatus`, `requestUploadedStatus`, `updateStatus`)
- file persistence (`writeUploadedFile`, `basePathFor`, `storageFor`)
- response building (`unprocessableEntityResponse`)

The constructor also duplicates wiring per upload type (`image`/`file`): separate `SecurePhotoStorage` instances (`$photoStorage`/`$fileStorage`) and separate `UploadFilenameValidator` instances (`$imageFilenameValidator`/`$fileFilenameValidator`), even though nearly every method already takes `$uploadType` as a parameter.

This is a different tool/track than the frontend/backend "Lizard nloc-medium" series (#1167 and its sub-issues) — PHPMD's method-count rule isn't part of that effort, and the proxy layer isn't covered there.

## Expected Behavior

`UploadHandler` becomes a thin coordinator that delegates to a small number of focused, single-responsibility collaborator classes, each independently testable, dropping the class back under PHPMD's method-count limit.

## Solution

Extract three collaborators, each built via a factory/constructor parameterized by upload type (`'image'`/`'file'`) rather than the handler holding a separate pair of instances per type — mirroring how nearly every extracted method already threads `$uploadType` through as an argument:

- **Content validator** (mime/rejection-reason logic: `rejectionReasonFor`, `imageRejectionReason`, `fileRejectionReason`, `detectedMimeType`, `hasPdfMagicBytes`, plus the `IMAGE_MIME_TYPES`/`IMAGE_EXTENSIONS`/`FILE_MIME_TYPES`/`FILE_EXTENSIONS` constants). Built for a given type, it composes with (not replaces) the existing `UploadFilenameValidator` in `lib/support/`, which stays focused on filename/extension checks only.
- **Upload-status client** (`requestUploadingStatus`, `requestUploadedStatus`, `updateStatus`, plus the `EXTRA_ALLOWED_FORWARD_HEADERS` constant) — a thin upload-specific wrapper around the existing generic `BackendClient`, which stays reusable for the other handlers (`DeleteHandler`, `CacheClearHandler`, `CacheSizeHandler`) that also depend on it.
- **Storage resolver** (`writeUploadedFile`, `basePathFor`, `storageFor`) — wraps the existing `SecurePhotoStorage`, resolving base path and storage guard for a given type instead of the handler holding two separate instances.

`UploadHandler` retains `extractUploadIdentifiers`, the `processsRequest` orchestration, and `unprocessableEntityResponse`, and holds one instance of each new collaborator instead of type-paired pairs.

Follow this project's existing extraction convention: new classes live under `proxy/extension/lib/support/` (alongside `BackendClient`, `SecurePhotoStorage`, `PathTraversalGuard`, `UploadFilenameValidator`) but keep the `Tent\RequestHandlers` namespace rather than introducing a new one — directory layout doesn't drive namespace in this codebase. Register new files in `proxy/extension/loader.php`'s explicit `require_once` order, before `UploadHandler.php`'s require line (no autoloader).

`UploadHandlerTest.php` tests exclusively through `handleRequest()` at the HTTP-mock boundary, so it should mostly survive the extraction unchanged; add new unit tests per collaborator, mirroring the existing `UploadFilenameValidatorTest.php`/`SecurePhotoStorageTest.php` pattern.

## Benefits

Improves testability and readability of the upload-handling code path, removes the constructor's per-type instance duplication, and closes a real complexity finding on a file not covered by the ongoing Lizard-nloc effort.

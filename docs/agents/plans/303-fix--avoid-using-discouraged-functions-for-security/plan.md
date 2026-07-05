# Plan: Fix: Avoid Using Discouraged Functions for Security

Issue: [303-fix--avoid-using-discouraged-functions-for-security.md](../issues/303-fix--avoid-using-discouraged-functions-for-security.md)

## Overview
`proxy/extension/lib/PhotoUploadHandler.php` calls `mkdir()`, `is_dir()`, and `pathinfo()` inline, with no hardening around either the directory-creation path or the extension check. This plan extracts both concerns into two small, independently testable classes — `SecurePhotoStorage` (path-traversal-safe directory creation) and `UploadFilenameValidator` (double-extension-safe filename validation) — and has `PhotoUploadHandler` delegate to them.

## Context
- `writePhotoFile()` builds `$destination = $this->photosBasePath . '/' . $filePath` and creates `dirname($destination)` via `is_dir()`/`mkdir()` with no verification that the resolved directory stays inside `photosBasePath`. Today `$filePath` comes from the backend's PATCH response, not the client directly, but nothing enforces that boundary in this file.
- `imageRejectionReason()` uses `pathinfo($file['name'], PATHINFO_EXTENSION)`, which only inspects the last extension segment. `image.php.jpg` yields `jpg` and passes, even though it carries a second, dangerous `.php` segment.
- Both usages live in one file with no dedicated tests covering the security-relevant edge cases (traversal, double extensions).

## Implementation Steps

### Step 1 — Add `SecurePhotoStorage`
Create `proxy/extension/lib/SecurePhotoStorage.php` in namespace `Tent\RequestHandlers`. It wraps directory creation for photo uploads:
- Constructor (or static method) takes a base path.
- A method, e.g. `ensureDirectoryFor(string $destination): void` (or `resolveDestination(string $basePath, string $relativePath): string` — pick whichever shape keeps `PhotoUploadHandler` simplest), that:
  1. Resolves `dirname($destination)` (or the base path + relative path) to a canonical absolute form.
  2. Verifies the resolved directory is contained within the base path — reject `..` traversal segments and any resolution that would escape the base path, even when the target directory does not exist yet (so canonicalization can't rely solely on `realpath()`, which returns `false` for non-existent paths — validate the string-level path first, e.g. by resolving `..`/`.` segments manually or checking the `realpath()` of the deepest existing ancestor).
  3. Only after the check passes, performs `is_dir()`/`mkdir()` (mode `0755`, recursive) exactly as `writePhotoFile()` does today.
  4. Throws an `InvalidArgumentException` (consistent with the existing 400 handling in `PhotoUploadHandler::processsRequest()`) when the path would escape the base.

### Step 2 — Add `UploadFilenameValidator`
Create `proxy/extension/lib/UploadFilenameValidator.php` in namespace `Tent\RequestHandlers`. It replaces the inline `pathinfo()` call in `imageRejectionReason()`:
- A method, e.g. `isAllowed(string $filename): bool` (or a method returning the extension when valid and null/false otherwise — pick whichever shape keeps `imageRejectionReason()`'s existing precedence logic simplest), that:
  1. Rejects any filename with more than one extension segment (more than one `.` in the name, e.g. `image.php.jpg`, `image.jpg.png`).
  2. Otherwise extracts the extension and checks it case-insensitively against the existing allowlist (`jpg, jpeg, png, gif, webp`).
- Keep the allowlist as a constant on this class (moved from `PhotoUploadHandler::imageRejectionReason()`), so it is defined once.

### Step 3 — Wire `PhotoUploadHandler` to the new classes
- `writePhotoFile()`: replace the inline `is_dir()`/`mkdir()` block with a call into `SecurePhotoStorage`, keeping the existing `Logger::error` call and `file_put_contents` behavior unchanged. Decide how `InvalidArgumentException` from a traversal rejection surfaces — the existing `catch (InvalidArgumentException $e)` in `processsRequest()` already turns that into a 400 response, so no new catch block is needed as long as `SecurePhotoStorage` throws `InvalidArgumentException`.
- `imageRejectionReason()`: replace the inline `pathinfo()`/allowlist check with a call into `UploadFilenameValidator`, keeping:
  - The existing MIME-type check first (`unsupported_mime_type` takes precedence).
  - `unsupported_extension` as the reason returned when `UploadFilenameValidator` rejects the filename (both for double extensions and for a disallowed single extension) — the issue does not ask for a new rejection reason, so reuse `unsupported_extension` for both cases unless a test in Step 4 shows the existing test suite expects otherwise.
- Both new classes should be constructed once (e.g. as instance properties initialized in the constructor, mirroring how `httpClient` is wired) or instantiated inline — follow whichever is simplest without adding new constructor parameters that would require changes to `PhotoUploadHandler::build()`.

### Step 4 — Tests
- `proxy/extension/tests/SecurePhotoStorageTest.php`: cover
  - Normal case: directory is created when the resolved path is inside the base.
  - Traversal rejection: relative path containing `..` that would resolve outside the base is rejected (directory not created, exception thrown), for both an existing and a non-existent base path.
  - Directory already exists: no error, `mkdir()` not attempted again.
- `proxy/extension/tests/UploadFilenameValidatorTest.php`: cover
  - Allowed single-extension filenames (`jpg, jpeg, png, gif, webp`) pass, case-insensitively.
  - Double-extension filenames (e.g. `image.php.jpg`, `image.jpg.png`) are rejected even though the last segment is allowlisted.
  - Disallowed single extension (e.g. `photo.txt`) is rejected.
- Update `proxy/extension/tests/PhotoUploadHandlerTest.php` only if the delegation changes any existing behavior/edge case (e.g. add a case for a double-extension filename asserting `422`/`unsupported_extension`, if not already implied by existing tests). Keep `testUnsupportedExtensionReturnsUnprocessableEntity` and `testInvalidFileTypeReturnsUnprocessableEntity` passing unchanged.

## Files to Change
- `proxy/extension/lib/SecurePhotoStorage.php` — new class: traversal-safe directory creation for photo uploads.
- `proxy/extension/lib/UploadFilenameValidator.php` — new class: filename validation rejecting double extensions, plus the existing allowlist check.
- `proxy/extension/lib/PhotoUploadHandler.php` — `writePhotoFile()` and `imageRejectionReason()` delegate to the two new classes instead of calling `mkdir()`/`is_dir()`/`pathinfo()` directly.
- `proxy/extension/tests/SecurePhotoStorageTest.php` — new tests for traversal-escape cases.
- `proxy/extension/tests/UploadFilenameValidatorTest.php` — new tests for double-extension and allowlist cases.
- `proxy/extension/tests/PhotoUploadHandlerTest.php` — updated only as needed for the delegation (existing rejection-reason tests must keep passing).

## Notes
- No CircleCI job currently runs the proxy PHP test suite; the local command is `docker-compose run proxy_tests` (service defined in `docker-compose.yml`, runs `vendor/bin/phpunit extension/tests`). Run this locally to verify before opening the PR, even though it isn't gated in CI.
- `realpath()` returns `false` for paths that don't exist yet, so `SecurePhotoStorage` cannot canonicalize the full destination directly when it hasn't been created — resolve traversal at the string level (normalize `.`/`..` segments) or validate against the realpath of the closest existing ancestor.
- This issue is entirely scoped to the `proxy` agent (`proxy/extension/lib` and `proxy/extension/tests`); no other agent has work here.

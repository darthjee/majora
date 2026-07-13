# Plan: Organize proxy libs

Issue: [448-organize-proxy-libs.md](../../issues/448-organize-proxy-libs.md)

## Overview
Split the flat `proxy/extension/lib` folder into four role-based subfolders (`middlewares/`, `handlers/`, `exceptions/`, `support/`), update the `require_once` paths in `proxy/extension/loader.php` to match, and mirror the same subfolder structure under `proxy/extension/tests/`. PHP namespaces (`Tent\Middlewares`, `Tent\RequestHandlers`) stay unchanged — this is a pure file-layout reorganization, entirely within the `proxy` agent's scope.

## Context
`proxy/extension/lib` currently has 8 classes in one flat folder, wired up via manual `require_once` calls in `loader.php` (no PSR-4 autoloading, so no autoload config to update). The classes already fall into four distinct roles:

- **Middlewares** (`Tent\Middlewares`): `CacheCleanupMapBuilder`, `CacheControlMiddleware`, `TestHeaderMiddleware`
- **Handler** (`Tent\RequestHandlers`): `PhotoUploadHandler`
- **Exceptions** thrown by the handler (`Tent\RequestHandlers`): `BackendErrorException`, `UnprocessableUploadException`
- **Support/validation helpers** used by the handler (`Tent\RequestHandlers`): `SecurePhotoStorage`, `UploadFilenameValidator`

`proxy/extension/tests/` has one PHPUnit test file per lib class except the two exceptions (no `BackendErrorExceptionTest.php` / `UnprocessableUploadExceptionTest.php` exist today).

## Implementation Steps

### Step 1 — Create the lib subfolders and move files
Create `proxy/extension/lib/middlewares/`, `lib/handlers/`, `lib/exceptions/`, `lib/support/`, and move each class file into its role folder (`git mv` to preserve history):

- `lib/middlewares/`: `CacheCleanupMapBuilder.php`, `CacheControlMiddleware.php`, `TestHeaderMiddleware.php`
- `lib/handlers/`: `PhotoUploadHandler.php`
- `lib/exceptions/`: `BackendErrorException.php`, `UnprocessableUploadException.php`
- `lib/support/`: `SecurePhotoStorage.php`, `UploadFilenameValidator.php`

Do not change any `namespace` declaration or class body — only the file's location changes.

### Step 2 — Update `loader.php`
Update each `require_once __DIR__ . '/lib/<Class>.php';` line in `proxy/extension/loader.php` to point at the class's new subfolder path (e.g. `/lib/middlewares/TestHeaderMiddleware.php`). Keep the existing require order (middlewares, then exceptions, then support, then handler) since it already reflects load-order dependencies (the handler requires the exceptions and support classes to already be defined).

### Step 3 — Mirror the structure under `tests/`
Create `proxy/extension/tests/middlewares/`, `tests/handlers/`, `tests/support/` (skip `tests/exceptions/` — no test files exist for the two exception classes today), and `git mv` each existing `*Test.php` into the folder matching its counterpart's new `lib/` location:

- `tests/middlewares/`: `CacheCleanupMapBuilderTest.php`, `CacheControlMiddlewareTest.php`, `TestHeaderMiddlewareTest.php`
- `tests/handlers/`: `PhotoUploadHandlerTest.php`
- `tests/support/`: `SecurePhotoStorageTest.php`, `UploadFilenameValidatorTest.php`

`tests/bootstrap.php` and `phpunit.xml` need no changes — `phpunit.xml` already points at `<directory>tests</directory>`, which PHPUnit scans recursively, and the bootstrap loads the whole framework via `loader.php` rather than requiring individual test file paths.

### Step 4 — Verify
Run the proxy test suite locally (see CI Checks below) and confirm all tests still pass with no changed behavior — this step only moves files and updates require paths, so test outcomes should be identical to before the move.

## Files to Change
- `proxy/extension/lib/CacheCleanupMapBuilder.php` → `proxy/extension/lib/middlewares/CacheCleanupMapBuilder.php`
- `proxy/extension/lib/CacheControlMiddleware.php` → `proxy/extension/lib/middlewares/CacheControlMiddleware.php`
- `proxy/extension/lib/TestHeaderMiddleware.php` → `proxy/extension/lib/middlewares/TestHeaderMiddleware.php`
- `proxy/extension/lib/PhotoUploadHandler.php` → `proxy/extension/lib/handlers/PhotoUploadHandler.php`
- `proxy/extension/lib/BackendErrorException.php` → `proxy/extension/lib/exceptions/BackendErrorException.php`
- `proxy/extension/lib/UnprocessableUploadException.php` → `proxy/extension/lib/exceptions/UnprocessableUploadException.php`
- `proxy/extension/lib/SecurePhotoStorage.php` → `proxy/extension/lib/support/SecurePhotoStorage.php`
- `proxy/extension/lib/UploadFilenameValidator.php` → `proxy/extension/lib/support/UploadFilenameValidator.php`
- `proxy/extension/tests/CacheCleanupMapBuilderTest.php` → `proxy/extension/tests/middlewares/CacheCleanupMapBuilderTest.php`
- `proxy/extension/tests/CacheControlMiddlewareTest.php` → `proxy/extension/tests/middlewares/CacheControlMiddlewareTest.php`
- `proxy/extension/tests/TestHeaderMiddlewareTest.php` → `proxy/extension/tests/middlewares/TestHeaderMiddlewareTest.php`
- `proxy/extension/tests/PhotoUploadHandlerTest.php` → `proxy/extension/tests/handlers/PhotoUploadHandlerTest.php`
- `proxy/extension/tests/SecurePhotoStorageTest.php` → `proxy/extension/tests/support/SecurePhotoStorageTest.php`
- `proxy/extension/tests/UploadFilenameValidatorTest.php` → `proxy/extension/tests/support/UploadFilenameValidatorTest.php`
- `proxy/extension/loader.php` — update the 8 `require_once` paths to the new subfolder locations

## CI Checks
- `proxy/extension`: `docker-compose run proxy_tests` (runs `vendor/bin/phpunit extension/tests`, recursive — no CI config changes needed since no job enumerates individual file paths)

## Notes
- No PSR-4 autoloading is configured for the proxy extension (plain `composer.json`, no `autoload` key), so there is no autoload map to regenerate — this is purely a manual `require_once`/file-move change.
- PHP namespaces are intentionally left as `Tent\Middlewares` / `Tent\RequestHandlers` per the issue's resolution — folder and namespace are not required to match here.
- CircleCI's deploy step (`SOURCE=proxy/extension/ ... upload`) uploads the whole `extension/` folder recursively and does not reference individual file paths, so it needs no changes.

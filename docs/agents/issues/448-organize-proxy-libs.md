# Issue: Organize proxy libs

## Description
The proxy extension's custom Tent classes currently sit in a single flat folder, `proxy/extension/lib`, with no sub-organization:

```
lib/BackendErrorException.php
lib/CacheCleanupMapBuilder.php
lib/CacheControlMiddleware.php
lib/PhotoUploadHandler.php
lib/SecurePhotoStorage.php
lib/TestHeaderMiddleware.php
lib/UnprocessableUploadException.php
lib/UploadFilenameValidator.php
```

These files already fall into distinct roles, partly reflected in their existing PHP namespaces:

- **Middlewares** (`Tent\Middlewares`): `CacheCleanupMapBuilder`, `CacheControlMiddleware`, `TestHeaderMiddleware`
- **Request handler** (`Tent\RequestHandlers`): `PhotoUploadHandler`
- **Exceptions** thrown by the handler (also namespaced `Tent\RequestHandlers`): `BackendErrorException`, `UnprocessableUploadException`
- **Support/validation helpers** used by the handler (also namespaced `Tent\RequestHandlers`): `SecurePhotoStorage`, `UploadFilenameValidator`

Classes are wired up via manual `require_once` calls in `proxy/extension/loader.php` (no PSR-4 autoloading), so reorganizing folders only requires updating those require paths — not a build/autoload config. PHP namespaces stay as-is (`Tent\Middlewares` / `Tent\RequestHandlers`); only the on-disk folder layout changes.

## Problem
A flat folder mixes middlewares, the request handler, its exceptions, and its support helpers together, making it harder to see at a glance what kind of class a file is and where a new one of a given kind should go as the proxy extension grows.

## Solution
Split `proxy/extension/lib` into four subfolders by role, and update the `require_once` paths in `proxy/extension/loader.php` accordingly. PHP namespaces are left unchanged.

```
lib/
  middlewares/
    CacheCleanupMapBuilder.php
    CacheControlMiddleware.php
    TestHeaderMiddleware.php
  handlers/
    PhotoUploadHandler.php
  exceptions/
    BackendErrorException.php
    UnprocessableUploadException.php
  support/
    SecurePhotoStorage.php
    UploadFilenameValidator.php
```

`proxy/extension/tests/` is reorganized to mirror the same subfolder structure (`tests/middlewares/`, `tests/handlers/`, `tests/exceptions/`, `tests/support/`), moving each existing `*Test.php` file alongside its counterpart's new location.

## Benefits
- Clearer navigation: the folder a file lives in signals what kind of class it is (middleware vs. handler vs. exception vs. support helper).
- Easier onboarding for adding new middlewares/handlers, since there's an obvious place for each kind to live.
- Tests mirror the same structure, so a file and its test are equally easy to locate.

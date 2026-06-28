# Plan: Fix PhotoUploadHandler

Issue: [179-fix-photouploadhandler.md](../issues/179-fix-photouploadhandler.md)

## Overview

`PhotoUploadHandler::build()` ignores the `$photosBasePath` constructor parameter and always lets it fall back to the hardcoded default `/var/www/html/photos`. The fix is to compute `photosBasePath` dynamically inside `build()` using `$_SERVER['DOCUMENT_ROOT']` (the document root reported by the web server), falling back to the existing default only when that variable is absent.

## Context

The constructor already accepts `$photosBasePath` as an injectable parameter and uses it correctly at runtime. The gap is entirely in the static `build()` factory, which is the entry-point used by Tent's route configuration. The correct value at runtime is `<tent-root>/photos`, where `<tent-root>` is `$_SERVER['DOCUMENT_ROOT']` (e.g. `/var/www/html` in the default installation).

## Implementation Steps

### Step 1 — Update `PhotoUploadHandler::build()`

Inside `build(array $params): self`, compute `$photosBasePath` before constructing the handler:

```php
$photosBasePath = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/') . '/photos';
```

Pass it as the third argument to `new self(...)`:

```php
return new self($params['host'] ?? '', null, $photosBasePath);
```

### Step 2 — Add a unit test for `build()`

In `PhotoUploadHandlerTest`, add a test that:
1. Sets `$_SERVER['DOCUMENT_ROOT']` to a temporary directory.
2. Calls `PhotoUploadHandler::build(['host' => 'http://backend:8080'])`.
3. Exercises the handler with a mock HTTP client returning a successful upload sequence.
4. Verifies the file is written to `<DOCUMENT_ROOT>/photos/<file_path>`.
5. Restores `$_SERVER['DOCUMENT_ROOT']` in teardown (or uses `setUp`/`tearDown`).

This validates that the factory wires the path correctly without requiring a real web server.

## Files to Change

- `proxy/extension/PhotoUploadHandler.php` — update `build()` to pass a dynamically computed `photosBasePath`
- `proxy/extension/tests/PhotoUploadHandlerTest.php` — add a test for the `build()` factory method

## CI Checks

- `proxy/extension`: `docker-compose run --rm proxy-test` (CI job: `proxy-tests`)

## Notes

- `$_SERVER['DOCUMENT_ROOT']` is the standard variable for the web server's document root and is always set by Apache/nginx. The fallback `'/var/www/html/photos'` is retained only for environments (e.g. CLI test runs) where no web server is present.
- Do not use `$_SERVER['SCRIPT_FILENAME']` — in CGI or some PHP-FPM setups it can point to an intermediate script rather than the true entry point.

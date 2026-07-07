# Plan: Fix PHP Codacy problems

Issue: [345-fix-php-codacy-problems.md](../../issues/345-fix-php-codacy-problems.md)

## Overview

Pure formatting fix, entirely confined to `proxy/extension/lib/PhotoUploadHandler.php` and
`proxy/extension/tests/PhotoUploadHandlerTest.php`, to satisfy the two remaining Codacy rules:
closing parenthesis of a multi-line function call must be on its own line, and null-coalescing
(`??`) expressions must be bracketed. No behavior changes.

## Context

Codacy flags two remaining categories of style issues in the proxy extension code:

1. **Closing parenthesis of a multi-line function call must be on a line by itself** — 4
   instances where an inline array argument's closing `]` is immediately followed by the
   call's closing `)` on the same line (e.g. `]);`).
2. **Operation must be bracketed** — unbracketed `??` (null-coalescing) expressions.

Two other categories originally reported by Codacy are already resolved and out of scope:
missing doc comments (already present on all production methods) and the discouraged raw
`mkdir()` call (already extracted into `SecurePhotoStorage::ensureDirectoryFor()` in
issue #303 / PR #308).

## Implementation Steps

### Step 1 — Split the 4 flagged `]);` closings onto two lines

In both files, wherever an inline array's closing `]` and the enclosing multi-line function
call's closing `)` share a line (`]);`), split them: `]` keeps its current line/indent, `)`
moves to a new line at the same indentation as the line where the call started. This mirrors
the style already used elsewhere in `PhotoUploadHandlerTest.php` (e.g. the existing
`makeRequest(...)` calls, where the closing `]` and `)` are already on separate lines).

Locations (line numbers as of the current `main`):
- `proxy/extension/lib/PhotoUploadHandler.php:152` — `return new Response([...]);` inside `processsRequest()`.
- `proxy/extension/lib/PhotoUploadHandler.php:381` — `return new Response([...]);` inside `unprocessableEntityResponse()`.
- `proxy/extension/tests/PhotoUploadHandlerTest.php:91` — `return new ProcessingRequest([...]);` inside `makeRequest()`.
- `proxy/extension/tests/PhotoUploadHandlerTest.php:402` — `PhotoUploadHandler::build([...]);` inside `testBuildSetsPhotosBasePathFromParams()`.

### Step 2 — Bracket every `??` expression in `PhotoUploadHandler.php`

Wrap the right-hand `??` expression of each flagged statement in parentheses (safe no-op given
`??`'s low precedence). Locations (line numbers as of the current `main`):
- `PhotoUploadHandler.php:83` — constructor: `$this->httpClient = $httpClient ?? new CurlHttpClient();`
- `PhotoUploadHandler.php:106` — `build()`: `$params['host'] ?? ''` and `$params['photos_path'] ?? ''` (two expressions on one line).
- `PhotoUploadHandler.php:182` — `validateUploadedFile()`: `$files['file'] ?? null`.
- `PhotoUploadHandler.php:211` — `requestUploadingStatus()`: `$body['file_path'] ?? null`.
- `PhotoUploadHandler.php:292` — `backendHost()`: `parse_url($this->host, PHP_URL_HOST) ?? $this->host`.
- `PhotoUploadHandler.php:339` — `imageRejectionReason()`: `$file['type'] ?? ''`.
- `PhotoUploadHandler.php:340` — `imageRejectionReason()`: `$file['name'] ?? ''`.
- `PhotoUploadHandler.php:364` — `unprocessableEntityResponse()`: `$file['name'] ?? ''`.
- `PhotoUploadHandler.php:365` — `unprocessableEntityResponse()`: `$file['type'] ?? ''`.

### Step 3 — Verify no behavior change

Run the proxy test suite locally via docker-compose and confirm all existing tests still pass
unmodified (aside from the reformatted closing-paren lines), since this is a pure formatting
change.

## Files to Change

- `proxy/extension/lib/PhotoUploadHandler.php` — split 2 `]);` closings onto their own line; bracket 9 `??` expressions.
- `proxy/extension/tests/PhotoUploadHandlerTest.php` — split 2 `]);` closings onto their own line.

## CI Checks

- `proxy/extension`: `docker-compose run proxy_tests` (runs `vendor/bin/phpunit extension/tests`)

## Notes

- This is a formatting-only change; no test assertions or fixture data should need to change.
- Codacy itself runs as an external check (not a CircleCI job in `.circleci/config.yml`), so
  there's no local command that reproduces the exact Codacy rule set — `proxy_tests` is the
  closest local verification (behavior-preserving) available.

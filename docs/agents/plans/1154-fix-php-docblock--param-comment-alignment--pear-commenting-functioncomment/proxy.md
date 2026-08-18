# Proxy Plan: Fix PHP docblock @param comment alignment (PEAR Commenting.FunctionComment)

Main plan: [plan.md](plan.md)

## Implementation Steps

For every file below, edit only docblock whitespace/content — no behavior changes. The sniff message states the exact expected space count; match it exactly (it counts spaces between the last token before the description — parameter type or parameter name — and the start of the description/continuation text, aligning wrapped lines to the same column as the first line's description).

### Step 1 — `proxy/extension/lib/cache/PrivateRequestHasher.php`
- Line 38: add a doc comment (`/** ... */`) above `__construct()` — currently missing entirely.
- Line 64: fix continuation-line alignment (expected 22 spaces, found 23).

### Step 2 — `proxy/extension/lib/handlers/CacheSizeHandler.php`
- Lines 39, 42, 43: fix spacing after parameter type (expected 23, found 24).
- Line 40: fix spacing after parameter type (expected 5, found 6).
- Line 47: fix spacing after parameter type (expected 1, found 2).
- Lines 41, 44, 45, 46, 48, 49: fix continuation-line alignment (expected 53 spaces, found 55).
- Line 67: fix continuation-line alignment (expected 22 spaces, found 24).

### Step 3 — `proxy/extension/lib/handlers/DeleteHandler.php`
- Line 133 (shifted from 131 in the original Codacy scan by #1151/#1165's mechanical fixes — verify against current `phpcs`/Codacy output before editing): fix spacing after parameter name (expected 5, found 4).

### Step 4 — `proxy/extension/lib/handlers/UploadHandler.php`
- Line 133: fix continuation-line alignment (expected 22 spaces, found 23).

### Step 5 — `proxy/extension/lib/middlewares/CacheCleanupMapBuilder.php`
- Lines 37, 38: fix continuation-line alignment (expected 22 spaces, found 23).
- Line 39: fix continuation-line alignment (expected 22 spaces, found 25).

### Step 6 — `proxy/extension/lib/middlewares/CacheControlMiddleware.php`
- Line 62: fix continuation-line alignment (expected 26 spaces, found 27).

### Step 7 — `proxy/extension/lib/middlewares/SetClientIpMiddleware.php`
- Line 51: fix continuation-line alignment (expected 26 spaces, found 27).

### Step 8 — `proxy/extension/lib/middlewares/TestHeaderMiddleware.php`
- Line 22: add the missing `@return` tag to the flagged function's docblock.

### Step 9 — `proxy/extension/lib/support/BackendClient.php`
- Lines 81, 84, 86, 87: fix continuation-line alignment (expected 41 spaces, found 42).

### Step 10 — `proxy/extension/lib/support/DuDirectorySizeStrategy.php`
- Line 23: fix continuation-line alignment (expected 43 spaces, found 45).

### Step 11 — `proxy/extension/lib/support/ForwardedHeaderFilter.php`
- Lines 44, 46, 47, 48, 49: fix continuation-line alignment (expected 31 spaces, found 32).

### Step 12 — `proxy/extension/lib/support/SecurePhotoStorage.php`
- Line 81: fix continuation-line alignment (expected 29 spaces, found 30).

### Step 13 — Verify
Run `phpcs` (see CI Checks below) and confirm zero `PHPCS_PEAR_Commenting_FunctionComment` occurrences remain, and no other sniff regressed. Run the existing PHPUnit suite to confirm no behavior changed (docblock-only edits shouldn't affect it, but confirm anyway).

## Files to Change
- `proxy/extension/lib/cache/PrivateRequestHasher.php` — add constructor docblock; fix one alignment
- `proxy/extension/lib/handlers/CacheSizeHandler.php` — fix 12 alignment issues
- `proxy/extension/lib/handlers/DeleteHandler.php` — fix 1 alignment issue (current line 133)
- `proxy/extension/lib/handlers/UploadHandler.php` — fix 1 alignment issue
- `proxy/extension/lib/middlewares/CacheCleanupMapBuilder.php` — fix 3 alignment issues
- `proxy/extension/lib/middlewares/CacheControlMiddleware.php` — fix 1 alignment issue
- `proxy/extension/lib/middlewares/SetClientIpMiddleware.php` — fix 1 alignment issue
- `proxy/extension/lib/middlewares/TestHeaderMiddleware.php` — add missing `@return` tag
- `proxy/extension/lib/support/BackendClient.php` — fix 4 alignment issues
- `proxy/extension/lib/support/DuDirectorySizeStrategy.php` — fix 1 alignment issue
- `proxy/extension/lib/support/ForwardedHeaderFilter.php` — fix 5 alignment issues
- `proxy/extension/lib/support/SecurePhotoStorage.php` — fix 1 alignment issue

## CI Checks
- `proxy`: `vendor/bin/phpcs --standard=proxy/phpcs.xml proxy` (CI job: `proxy_extension_tests`, "Check PHP Lint" step in `.circleci/config.yml`)
- `proxy`: `vendor/bin/phpunit --bootstrap proxy/extension/tests/bootstrap.php proxy/extension/tests` (CI job: `proxy_extension_tests`, "Tests" step)

## Notes
- `phpcbf` cannot auto-fix these — wrapped-comment realignment requires re-flowing prose, which isn't a safe mechanical rewrite (that's why #1151/#1165 left them out).
- Line numbers were re-verified live against Codacy's analysis of the current `main` (commit `5a4cce10`, already re-scanned after #1151/#1165). Only `DeleteHandler.php` shifted (131 → 133); re-check against a fresh `phpcs` run before editing in case anything else has moved since.
- Out of scope: `int`/`bool` vs `integer`/`boolean` type-tag normalization in `BackendErrorException.php`/`ShellCommandFailedException.php` — neither file is flagged by this sniff, and both are outside the 12 listed files.

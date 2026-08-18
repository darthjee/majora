# Issue: Fix PHP docblock @param comment alignment (PEAR Commenting.FunctionComment)

## Description
Codacy's `PHP_CodeSniffer` (PEAR `Commenting.FunctionComment` sniff) flags 33 docblock issues across 12 files in `proxy/`. Most are `@param`/`@var` continuation-line misalignment (the wrapped description line doesn't start at the expected column), with two comment-completeness issues (a missing `@return` tag and a missing function docblock) mixed in. `phpcbf` cannot safely auto-fix any of these, since fixing wrapped-comment alignment requires re-flowing prose rather than a mechanical rewrite — that's why they were left out of #1151/#1165, which only auto-fixed the mechanical violations.

## Problem
Codacy's `PHP_CodeSniffer` (PEAR `Commenting.FunctionComment` sniff), re-checked against the current `main` (commit `5a4cce10`, after #1151/#1165's mechanical auto-fixes), still flags 33 occurrences across the same 12 files. Line numbers match the original scan except `DeleteHandler.php`, which shifted from line 131 to 133 due to that intervening commit.

- `proxy/extension/lib/cache/PrivateRequestHasher.php`
  - line 38: Missing doc comment for function __construct()
  - line 64: Parameter comment not aligned correctly; expected 22 spaces but found 23
- `proxy/extension/lib/handlers/CacheSizeHandler.php`
  - line 39: Expected 23 spaces after parameter type; 24 found
  - line 40: Expected 5 spaces after parameter type; 6 found
  - line 41: Parameter comment not aligned correctly; expected 53 spaces but found 55
  - line 42: Expected 23 spaces after parameter type; 24 found
  - line 43: Expected 23 spaces after parameter type; 24 found
  - line 44: Parameter comment not aligned correctly; expected 53 spaces but found 55
  - line 45: Parameter comment not aligned correctly; expected 53 spaces but found 55
  - line 46: Parameter comment not aligned correctly; expected 53 spaces but found 55
  - line 47: Expected 1 spaces after parameter type; 2 found
  - line 48: Parameter comment not aligned correctly; expected 53 spaces but found 55
  - line 49: Parameter comment not aligned correctly; expected 53 spaces but found 55
  - line 67: Parameter comment not aligned correctly; expected 22 spaces but found 24
- `proxy/extension/lib/handlers/DeleteHandler.php`
  - line 133: Expected 5 spaces after parameter name; 4 found
- `proxy/extension/lib/handlers/UploadHandler.php`
  - line 133: Parameter comment not aligned correctly; expected 22 spaces but found 23
- `proxy/extension/lib/middlewares/CacheCleanupMapBuilder.php`
  - line 37: Parameter comment not aligned correctly; expected 22 spaces but found 23
  - line 38: Parameter comment not aligned correctly; expected 22 spaces but found 23
  - line 39: Parameter comment not aligned correctly; expected 22 spaces but found 25
- `proxy/extension/lib/middlewares/CacheControlMiddleware.php`
  - line 62: Parameter comment not aligned correctly; expected 26 spaces but found 27
- `proxy/extension/lib/middlewares/SetClientIpMiddleware.php`
  - line 51: Parameter comment not aligned correctly; expected 26 spaces but found 27
- `proxy/extension/lib/middlewares/TestHeaderMiddleware.php`
  - line 22: Missing @return tag in function comment
- `proxy/extension/lib/support/BackendClient.php`
  - line 81: Parameter comment not aligned correctly; expected 41 spaces but found 42
  - line 84: Parameter comment not aligned correctly; expected 41 spaces but found 42
  - line 86: Parameter comment not aligned correctly; expected 41 spaces but found 42
  - line 87: Parameter comment not aligned correctly; expected 41 spaces but found 42
- `proxy/extension/lib/support/DuDirectorySizeStrategy.php`
  - line 23: Parameter comment not aligned correctly; expected 43 spaces but found 45
- `proxy/extension/lib/support/ForwardedHeaderFilter.php`
  - line 44: Parameter comment not aligned correctly; expected 31 spaces but found 32
  - line 46: Parameter comment not aligned correctly; expected 31 spaces but found 32
  - line 47: Parameter comment not aligned correctly; expected 31 spaces but found 32
  - line 48: Parameter comment not aligned correctly; expected 31 spaces but found 32
  - line 49: Parameter comment not aligned correctly; expected 31 spaces but found 32
- `proxy/extension/lib/support/SecurePhotoStorage.php`
  - line 81: Parameter comment not aligned correctly; expected 29 spaces but found 30

`phpcbf` cannot auto-fix any of these — realigning a wrapped `@param`/`@var` continuation line requires re-flowing prose to the sniff's expected column, which isn't a safe mechanical rewrite.

## Expected Behavior
Running `vendor/bin/phpcs --standard=proxy/phpcs.xml proxy` (as CI does) reports zero `PHPCS_PEAR_Commenting_FunctionComment` issues, with no change to runtime behavior — only docblock formatting changes.

## Solution
For each occurrence above, edit only the docblock:
- Re-align the wrapped `@param`/`@var` continuation line so it starts at the sniff's stated expected column (add/remove spaces only — don't reword the description).
- Fix the two non-alignment gaps: add a doc comment to `PrivateRequestHasher::__construct()` (line 38), and add a `@return` tag to the function flagged in `TestHeaderMiddleware.php` (line 22).
- Re-run `phpcs` (or re-check Codacy) against `proxy/` after the fix to confirm no `PHPCS_PEAR_Commenting_FunctionComment` occurrences remain and no other sniff regressed.

Out of scope: the `int`/`bool` vs `integer`/`boolean` type-tag question raised during discussion doesn't correspond to any currently-flagged occurrence (the two files that use bare `int` — `BackendErrorException.php`, `ShellCommandFailedException.php` — aren't flagged by this sniff and aren't part of this issue).

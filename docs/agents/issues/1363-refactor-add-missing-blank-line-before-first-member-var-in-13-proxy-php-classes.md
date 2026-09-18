# Issue: Refactor: add missing blank line before first member var in 13 proxy/ PHP classes

## Problem
Codacy's PHP_CodeSniffer scan (`Squiz.WhiteSpace.MemberVarSpacing`, CodeStyle, Info severity) flags 13 classes under `proxy/` whose first member variable is not preceded by a blank line, which is the project's established PHP formatting convention.

## Solution
Add one blank line before the first member variable declaration in each of the following classes:

- proxy/extension/lib/support/DirectorySizeCalculator.php:19
- proxy/extension/lib/support/BackendClient.php:35
- proxy/extension/lib/exceptions/UnprocessableUploadException.php:17
- proxy/extension/lib/handlers/CacheSizeHandler.php:30
- proxy/extension/lib/cache/PrivateRequestHasher.php:36
- proxy/extension/lib/support/UploadStorageResolver.php:16
- proxy/extension/lib/support/DuDirectorySizeStrategy.php:19
- proxy/extension/lib/handlers/DeleteHandler.php:25
- proxy/extension/lib/exceptions/BackendErrorException.php:17
- proxy/extension/lib/handlers/CacheClearHandler.php:33
- proxy/extension/lib/exceptions/ShellCommandFailedException.php:19
- proxy/extension/lib/support/UploadFilenameValidator.php:22
- proxy/extension/lib/support/SecurePhotoStorage.php:28

## Acceptance Criteria

- [ ] All 13 flagged classes have a blank line before their first member variable
- [ ] Proxy PHPCS lint passes with 0 `Squiz.WhiteSpace.MemberVarSpacing` findings

## Benefits
Keeps proxy/ PHP classes consistent with the project's formatting convention and clears the Codacy findings for this rule.

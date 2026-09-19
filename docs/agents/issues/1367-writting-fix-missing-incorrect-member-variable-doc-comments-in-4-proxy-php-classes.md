# Issue: Fix missing/incorrect member variable doc comments in 4 proxy/ PHP classes

## Description
Codacy's PHP_CodeSniffer scan (`Squiz.Commenting.VariableComment`, Documentation, Info severity) flags 4 member-variable doc comments across `proxy/` PHP classes: one missing entirely, and three using PHP's short scalar type names (`int`, `bool`) instead of the PEAR/PHPCS-expected long forms (`integer`, `boolean`) in their `@var` tag.

## Expected Behavior
- [ ] All 4 flagged member variables have a correctly-formatted doc comment with the expected `@var` type name
- [ ] Codacy's PHPCS `Squiz.Commenting.VariableComment` finding clears for these files

## Solution
Fix each flagged doc comment:

- `proxy/extension/lib/cache/PrivateRequestHasher.php:37` — add a missing member variable doc comment for `$headerName`
- `proxy/extension/lib/exceptions/BackendErrorException.php:17` — change `@var int` to `@var integer`
- `proxy/extension/lib/exceptions/ShellCommandFailedException.php:22` — change `@var int` to `@var integer`
- `proxy/extension/lib/support/UploadContentValidator.php:61` — change `@var bool` to `@var boolean`

Note: the line numbers above reflect the files' current state. 3 of the 4 locations shifted down by one line after #1363 ("add missing blank line before first member var in 13 proxy/ PHP classes") landed following Codacy's original scan; `UploadContentValidator.php:61` was unaffected.

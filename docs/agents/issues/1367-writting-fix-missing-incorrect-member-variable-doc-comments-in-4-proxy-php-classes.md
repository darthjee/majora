# Writting: fix missing/incorrect member variable doc comments in 4 proxy/ PHP classes

## Context

Codacy's PHP_CodeSniffer scan (`Squiz.Commenting.VariableComment`, Documentation, Info severity) flags 4 member-variable doc comments: one missing entirely, and three using PHP's short scalar type names (`int`, `bool`) instead of the PEAR/PHPCS-expected long forms (`integer`, `boolean`) in their `@var` tag.

## What needs to be done

Proxy: fix each flagged doc comment:

- proxy/extension/lib/cache/PrivateRequestHasher.php:36 — add a missing member variable doc comment
- proxy/extension/lib/exceptions/BackendErrorException.php:16 — change `@var int` to `@var integer`
- proxy/extension/lib/exceptions/ShellCommandFailedException.php:21 — change `@var int` to `@var integer`
- proxy/extension/lib/support/UploadContentValidator.php:61 — change `@var bool` to `@var boolean`

## Acceptance criteria

- [ ] All 4 flagged member variables have a correctly-formatted doc comment with the expected `@var` type name
- [ ] Codacy's PHPCS `Squiz.Commenting.VariableComment` finding clears for these files

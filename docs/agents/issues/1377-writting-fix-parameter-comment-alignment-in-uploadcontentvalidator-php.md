# Writting: fix parameter comment alignment in UploadContentValidator.php

## Context

Codacy's PHP_CodeSniffer scan (`PEAR.Commenting.FunctionComment`, Documentation, Info severity) flags `proxy/extension/lib/support/UploadContentValidator.php:68` for a parameter doc comment that isn't aligned correctly — 53 spaces found where 52 were expected.

## What needs to be done

Proxy: fix the parameter comment alignment at `UploadContentValidator.php:68` to match the project's PHPDoc alignment convention (expected 52 spaces).

## Acceptance criteria

- [ ] The parameter comment at UploadContentValidator.php:68 is correctly aligned
- [ ] Codacy's PHPCS `PEAR.Commenting.FunctionComment` finding clears for this file

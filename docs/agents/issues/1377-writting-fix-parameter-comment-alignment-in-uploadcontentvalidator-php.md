# Issue: Writting: fix parameter comment alignment in UploadContentValidator.php

## Description
Codacy's PHP_CodeSniffer scan (`PEAR.Commenting.FunctionComment`, Documentation, Info severity) flags `proxy/extension/lib/support/UploadContentValidator.php:68` for a parameter doc comment that isn't aligned correctly — 53 spaces found where 52 were expected.

## Problem
In the `@param bool $checkPdfMagicBytes` docblock of the private constructor, the continuation line (`'%PDF-' magic header.`, line 68) is indented one space too far. It starts at column 60, while the description text it continues (`Whether ...`, line 67) starts at column 59.

## Expected Behavior
The continuation line at `UploadContentValidator.php:68` is aligned with the start of the parameter description on line 67 (52 spaces after the `*`), so PHPCS `PEAR.Commenting.FunctionComment` no longer reports it.

## Solution
Remove one space of indentation from line 68 of `proxy/extension/lib/support/UploadContentValidator.php`. Whitespace-only change inside a docblock; no code behavior changes. Owned by the `proxy` agent (the file lives under `proxy/`).

## Benefits
- Clears the Codacy PHPCS finding for this file.
- Keeps PHPDoc alignment consistent with the project's convention (`proxy/phpcs.xml`).

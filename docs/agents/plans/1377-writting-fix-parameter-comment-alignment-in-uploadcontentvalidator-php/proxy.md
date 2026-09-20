# Proxy Plan: Writting: fix parameter comment alignment in UploadContentValidator.php

Main plan: [plan.md](plan.md)

## Overview
Remove one stray space from a docblock continuation line in `proxy/extension/lib/support/UploadContentValidator.php` so Codacy's PHPCS `PEAR.Commenting.FunctionComment` finding clears.

## Context
The `@param bool $checkPdfMagicBytes` docblock of the private constructor wraps onto a second line (`'%PDF-' magic header.`, line 68). That continuation is indented 53 spaces after the `*`, where the sniff expects 52. The description it continues (`Whether ...`, line 67) starts at column 59, while the continuation starts at column 60.

## Implementation Steps

### Step 1 — Fix the continuation-line indentation
Remove exactly one space of indentation from line 68 so the `'%PDF-' magic header.` text lines up under `Whether` on line 67 (52 spaces between `*` and the text). Whitespace-only change inside a docblock — no code or behavior changes. Leave lines 65-67 untouched.

### Step 2 — Verify
Confirm the description text on lines 67 and 68 now start at the same column, and run the proxy checks listed under CI Checks.

## Files to Change
- `proxy/extension/lib/support/UploadContentValidator.php` — line 68: drop one leading space in the docblock continuation.

## CI Checks
- `proxy/`: `docker-compose run --rm proxy_tests` (CI job: `proxy_extension_tests`; see `.claude/scripts/check_proxy.sh` for the PHP lint step too)

## Notes
- The repo's `proxy/phpcs.xml` only enables `PEAR.Functions.FunctionCallSignature` and `Squiz.Functions.FunctionDeclarationArgumentSpacing`, so the local/CI phpcs run will not report this finding either way. Verification of the actual fix is the column alignment plus Codacy's re-scan on the PR.
- Do not add `PEAR.Commenting.FunctionComment` to `phpcs.xml` as part of this issue — out of scope, and it would likely surface other findings.

# Issue: Refactor: replace ELSEIF with ELSE IF in SecurePhotoStorage.php

## Description
Codacy's PHP_CodeSniffer scan (`Squiz.ControlStructures.ElseIfDeclaration`, CodeStyle, Info severity) flags `proxy/extension/lib/support/SecurePhotoStorage.php:158`. The sniff ("Usage of ELSEIF not allowed; use ELSE IF instead") requires the two-word `else if` form and rejects the single-word `elseif`.

## Problem
Line 158 of `SecurePhotoStorage.php` uses `} elseif (!$isAbsolute) {`, which violates the sniff. It is the only `elseif` in any PHP file under `proxy/`, so no other file is affected.

## Expected Behavior
`SecurePhotoStorage.php:158` uses `else if`, and Codacy's `Squiz.ControlStructures.ElseIfDeclaration` finding clears for this file.

## Solution
Proxy (owner: `proxy` agent): change `} elseif (!$isAbsolute) {` to `} else if (!$isAbsolute) {` at `proxy/extension/lib/support/SecurePhotoStorage.php:158`. Purely syntactic — no behavior change.

### Acceptance criteria
- [ ] `SecurePhotoStorage.php:158` uses `else if` instead of `elseif`
- [ ] Codacy's PHPCS `Squiz.ControlStructures.ElseIfDeclaration` finding clears for this file
- [ ] Existing SecurePhotoStorage tests still pass

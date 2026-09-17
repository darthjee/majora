# Refactor: replace ELSEIF with ELSE IF in SecurePhotoStorage.php

## Context

Codacy's PHP_CodeSniffer scan (`Squiz.ControlStructures.ElseIfDeclaration`, CodeStyle, Info severity) flags `proxy/extension/lib/support/SecurePhotoStorage.php:158` for using `elseif` instead of the project's `else if` convention.

## What needs to be done

Proxy: change `elseif` to `else if` at `SecurePhotoStorage.php:158`.

## Acceptance criteria

- [ ] SecurePhotoStorage.php:158 uses `else if` instead of `elseif`
- [ ] Codacy's PHPCS `Squiz.ControlStructures.ElseIfDeclaration` finding clears for this file
- [ ] Existing SecurePhotoStorage tests still pass

# Plan: Refactor: replace ELSEIF with ELSE IF in SecurePhotoStorage.php

Issue: [1378-refactor-replace-elseif-with-else-if-in-securephotostorage-php.md](../../issues/1378-refactor-replace-elseif-with-else-if-in-securephotostorage-php.md)

## Overview
Replace the single `elseif` at `proxy/extension/lib/support/SecurePhotoStorage.php:158` with `else if` to satisfy Codacy's `Squiz.ControlStructures.ElseIfDeclaration` sniff.

See [proxy.md](proxy.md) for the full plan.

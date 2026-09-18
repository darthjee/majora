# Plan: Refactor: fix multi-line IF formatting in PathTraversalGuard.php and SecurePhotoStorage.php

Issue: [1366-refactor-fix-multi-line-if-formatting-in-pathtraversalguard-php-and-securephotostorage-php.md](../issues/1366-refactor-fix-multi-line-if-formatting-in-pathtraversalguard-php-and-securephotostorage-php.md)

## Overview

Codacy's PHPCS `PEAR.ControlStructures.MultiLineCondition` check flags two multi-line `if` statements in the proxy extension because their first condition sits on its own line instead of directly after the opening `(`. Reformat both to the project's PEAR multi-line-condition style, with no behavior change.

## Context

- `proxy/extension/lib/support/PathTraversalGuard.php:65-68`:
  ```php
  if (
      $realPath !== $realBase
      && strncmp($realPath, $realBase . '/', (strlen($realBase) + 1)) !== 0
  ) {
  ```
- `proxy/extension/lib/support/SecurePhotoStorage.php:125-128`:
  ```php
  if (
      $normalizedDir !== $normalizedBase
      && strncmp($normalizedDir, $normalizedBase . '/', (strlen($normalizedBase) + 1)) !== 0
  ) {
  ```

## Implementation Steps

### Step 1 — Reformat both multi-line `if` statements

In each file, move the first condition up onto the same line as the opening `(`, keeping the `&&` continuation line and closing `) {` unchanged:

```php
if ($realPath !== $realBase
    && strncmp($realPath, $realBase . '/', (strlen($realBase) + 1)) !== 0
) {
```

```php
if ($normalizedDir !== $normalizedBase
    && strncmp($normalizedDir, $normalizedBase . '/', (strlen($normalizedBase) + 1)) !== 0
) {
```

## Files to Change

- `proxy/extension/lib/support/PathTraversalGuard.php` — reformat the `if` at lines 65-68 to PEAR multi-line-condition style
- `proxy/extension/lib/support/SecurePhotoStorage.php` — reformat the `if` at lines 125-128 to PEAR multi-line-condition style

## CI Checks

- `proxy`: `vendor/bin/phpcs --standard=proxy/phpcs.xml proxy` (CI job: `proxy_extension_tests`)
- `proxy`: `vendor/bin/phpunit --bootstrap proxy/extension/tests/bootstrap.php proxy/extension/tests` (CI job: `proxy_extension_tests`)

## Notes

- Purely cosmetic formatting change; no logic, tests, or public interface changes are expected.

# Proxy Plan: Refactor: remove unnecessary else clause in CacheClearHandler::clearCacheContents

Main plan: [plan.md](plan.md)

## Overview
Codacy's PHPMD rule `cleancode.ElseExpression` flags the `else` in the `foreach` loop of `CacheClearHandler::clearCacheContents` (`proxy/extension/lib/handlers/CacheClearHandler.php`, around line 119). Replace the `if/else` with an early `continue` so behavior stays identical.

## Context
Current loop body:

```php
if ($entry->isDir()) {
    rmdir($path);
} else {
    unlink($path);
}
```

The iterator is `RecursiveIteratorIterator::CHILD_FIRST`, so nested entries are visited before their parent directory. That ordering is unaffected by the refactor.

## Implementation Steps

### Step 1 — Replace the else with an early continue
In `clearCacheContents`, rewrite the loop body as:

```php
if ($entry->isDir()) {
    rmdir($path);
    continue;
}

unlink($path);
```

Keep the existing docblock and the `// @var SplFileInfo $entry` comment unchanged. Do not touch anything else in the file.

### Step 2 — Verify
Run the proxy lint and the existing `CacheClearHandlerTest` (see CI Checks). No test changes are expected, since behavior is identical. If phpcs or phpunit is not available locally, rely on the CI job `proxy_extension_tests`.

## Files to Change
- `proxy/extension/lib/handlers/CacheClearHandler.php` — replace the `if/else` in `clearCacheContents` with an early `continue`

## CI Checks
- `proxy`: `vendor/bin/phpcs --standard=proxy/phpcs.xml proxy` and `vendor/bin/phpunit --bootstrap extension/tests/bootstrap.php extension/tests` (CI job: `proxy_extension_tests`)

## Notes
- No new tests are needed. `proxy/extension/tests/handlers/CacheClearHandlerTest.php` already covers the file and directory removal paths.
- The Codacy finding can only be confirmed as cleared after the PR is analyzed by Codacy.

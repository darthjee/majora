# Issue: Refactor: remove unnecessary else clause in CacheClearHandler::clearCacheContents

## Description
Codacy's PHP Mess Detector scan (`cleancode.ElseExpression`, CodeStyle, Info severity) flags `proxy/extension/lib/handlers/CacheClearHandler.php:119`. The `foreach` loop in `CacheClearHandler::clearCacheContents` uses an `if ($entry->isDir()) { rmdir($path); } else { unlink($path); }` construct whose `else` clause PHPMD considers unnecessary.

## Problem
The `else` branch adds nesting the rule considers avoidable, and leaves a Codacy finding open on this file.

## Expected Behavior
`clearCacheContents` no longer contains an `else` clause. The `if` branch calls `rmdir($path)` and then `continue`s to the next entry, and `unlink($path)` follows unconditionally. Runtime behavior stays identical: directories are removed, files are unlinked, and a missing cache folder is still a no-op.

## Solution
Proxy: in `proxy/extension/lib/handlers/CacheClearHandler.php`, refactor the loop body of `clearCacheContents` to use an early `continue` in the `isDir()` branch instead of `else`. No other files should need to change.

### Acceptance criteria
- [ ] `clearCacheContents` no longer uses an `else` clause where PHPMD flagged it
- [ ] Existing `CacheClearHandlerTest` tests (`proxy/extension/tests/handlers/CacheClearHandlerTest.php`) still pass with identical behavior
- [ ] Codacy's PHPMD `cleancode.ElseExpression` finding clears for this file

## Benefits
Clears a Codacy code-style finding and keeps the proxy code consistent with the project's static-analysis rules.

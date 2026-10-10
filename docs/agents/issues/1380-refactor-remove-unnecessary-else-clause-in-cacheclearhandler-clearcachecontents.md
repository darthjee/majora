# Refactor: remove unnecessary else clause in CacheClearHandler::clearCacheContents

## Context

Codacy's PHP Mess Detector scan (`cleancode.ElseExpression`, CodeStyle, Info severity) flags `proxy/extension/lib/handlers/CacheClearHandler.php:119` — the `clearCacheContents` method uses an `else` clause that isn't necessary and can be simplified away (e.g. by returning/continuing early in the `if` branch).

## What needs to be done

Proxy: refactor `CacheClearHandler::clearCacheContents` (around line 119) to remove the unnecessary `else` clause, using an early return/continue in the `if` branch instead, while keeping behavior identical.

## Acceptance criteria

- [ ] `clearCacheContents` no longer uses an else clause where PHPMD flagged it
- [ ] Existing CacheClearHandler tests still pass with identical behavior
- [ ] Codacy's PHPMD `cleancode.ElseExpression` finding clears for this file

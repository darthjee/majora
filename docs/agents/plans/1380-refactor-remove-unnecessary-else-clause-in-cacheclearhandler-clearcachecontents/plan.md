# Plan: Refactor: remove unnecessary else clause in CacheClearHandler::clearCacheContents

Issue: [1380-refactor-remove-unnecessary-else-clause-in-cacheclearhandler-clearcachecontents.md](../../issues/1380-refactor-remove-unnecessary-else-clause-in-cacheclearhandler-clearcachecontents.md)

## Overview
Remove the `else` clause PHPMD flags in `CacheClearHandler::clearCacheContents` by using an early `continue` after `rmdir`, keeping behavior identical.

See [proxy.md](proxy.md) for the full plan.

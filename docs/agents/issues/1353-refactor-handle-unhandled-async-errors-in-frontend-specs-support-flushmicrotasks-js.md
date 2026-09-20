# Issue: Refactor: handle unhandled async errors in frontend/specs/support/flushMicrotasks.js

## Description
Codacy's ESLint security-node scan (`detect-unhandled-async-errors`, Security, High severity) flags `frontend/specs/support/flushMicrotasks.js:9` — the `for` loop inside the `async function flushMicrotasks` declared on line 8 — for asynchronous code whose errors aren't handled.

## Problem
- Issue #1322 already extracted the helper into this file and added an `eslint-disable-next-line security-node/detect-unhandled-async-errors` comment, but that comment sits inside the empty `catch` block (line 13) and therefore only covers line 14 (the closing brace), not the flagged line 9. The finding therefore persists.
- The project's own `eslint-plugin-security-node` does not enable (and, per an upstream bug, cannot run) this rule, so the finding is only visible in Codacy and cannot be reproduced locally. `frontend/eslint.config.mjs` carries a file-scoped override (`reportUnusedDisableDirectives: 'off'`) solely to keep the misplaced suppression comment alive.
- The `try`/`catch` around `await Promise.resolve()` is dead code: `Promise.resolve()` never rejects.

## Expected Behavior
The helper no longer triggers Codacy's `detect-unhandled-async-errors` finding, still flushes the requested number of microtask ticks, and never leaves an unhandled rejection.

## Solution
Rewrite `flushMicrotasks` as a plain (non-`async`) function that builds and returns a promise chain of `times` `.then()` ticks starting from `Promise.resolve()`. With no `async` function there is nothing for the rule to flag, the dead `try`/`catch` and the misplaced `eslint-disable` comment go away, and the file-scoped `reportUnusedDisableDirectives` override in `frontend/eslint.config.mjs` can be removed. Call sites (`ResilientRequestSpec.js`, `RecoverPasswordControllerSpec.js`) keep working unchanged, since the function still returns a `Promise<void>`.

## Acceptance criteria
- [ ] `flushMicrotasks.js` no longer declares an `async` function and has no empty `catch`/misplaced `eslint-disable` comment
- [ ] The file-scoped `reportUnusedDisableDirectives` override for this file is removed from `frontend/eslint.config.mjs`
- [ ] The frontend spec suite (`yarn test`) and `yarn lint` still pass
- [ ] Codacy's ESLint `detect-unhandled-async-errors` finding clears for this file

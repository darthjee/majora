# Issue: Unhandled async errors in test specs (RecoverPasswordControllerSpec, ResilientRequestSpec)

## Description
Codacy's ESLint rule `security-node/detect-unhandled-async-errors` (High severity) flags one issue each in two Jasmine spec files, both pointing at line 12:

- `frontend/specs/assets/js/components/resources/account/pages/controllers/RecoverPasswordControllerSpec.js`
- `frontend/specs/assets/js/client/ResilientRequestSpec.js`

Both files independently define an (almost) identical helper:

```js
async function flushMicrotasks(times = 10) {
  for (let i = 0; i < times; i += 1) {
    await Promise.resolve();
  }
}
```

## Problem
The flagged line is the `await Promise.resolve();` inside `flushMicrotasks`' `for` loop. The function is `async` but the `await` is not wrapped in a `try`/`catch`, so the linter can't statically verify a rejection would be handled — even though `Promise.resolve()` itself never rejects, so this is a static-analysis concern rather than an observed runtime failure.

## Expected Behavior
Both spec files pass the Codacy `security-node/detect-unhandled-async-errors` check with no change to test behavior or timing semantics (`flushMicrotasks` keeps flushing the same number of microtask ticks).

## Solution
Wrap the `await Promise.resolve();` inside `flushMicrotasks` in a `try`/`catch` in both files, so the async function has explicit error handling around its only `await`.

## Benefits
Removes the Codacy security-lint findings without weakening test coverage or masking a genuine unhandled-rejection risk.

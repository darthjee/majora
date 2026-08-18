# Frontend Plan: Unhandled async errors in test specs (RecoverPasswordControllerSpec, ResilientRequestSpec)

Main plan: [plan.md](plan.md)

## Overview

Codacy's ESLint rule `security-node/detect-unhandled-async-errors` (High severity) flags one issue in each of these two Jasmine spec files, both on the same line — the local `flushMicrotasks` helper's `await Promise.resolve();`, which has no `try`/`catch`:

- `frontend/specs/assets/js/components/resources/account/pages/controllers/RecoverPasswordControllerSpec.js` (line 12)
- `frontend/specs/assets/js/client/ResilientRequestSpec.js` (line 12)

```js
async function flushMicrotasks(times = 10) {
  for (let i = 0; i < times; i += 1) {
    await Promise.resolve();
  }
}
```

Per discussion on the issue, the fix stays in place in each file (no extraction into a shared test-helper module).

## Implementation Steps

### Step 1 — Wrap the await in try/catch in `RecoverPasswordControllerSpec.js`

In `flushMicrotasks` (top of the file), wrap the `await Promise.resolve();` inside the `for` loop in a `try`/`catch`. `Promise.resolve()` never rejects, so the `catch` block only needs to exist to satisfy the linter — leave it empty with a short comment explaining why, matching this repo's convention of never leaving an unexplained empty block.

### Step 2 — Wrap the await in try/catch in `ResilientRequestSpec.js`

Apply the same change to `ResilientRequestSpec.js`'s own copy of `flushMicrotasks`.

### Step 3 — Verify

- Run the Jasmine suite for both files and confirm all existing tests still pass with unchanged timing semantics (`flushMicrotasks` must still flush the same number of microtask ticks).
- Run ESLint and confirm the `security-node/detect-unhandled-async-errors` finding is gone for both files.

## Files to Change

- `frontend/specs/assets/js/components/resources/account/pages/controllers/RecoverPasswordControllerSpec.js` — wrap `flushMicrotasks`'s `await` in `try`/`catch`.
- `frontend/specs/assets/js/client/ResilientRequestSpec.js` — wrap `flushMicrotasks`'s `await` in `try`/`catch`.

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- This is a static-analysis-only concern: `Promise.resolve()` cannot reject, so there is no observed runtime failure being fixed, only the lint finding.
- Scope is deliberately narrow (in-place fix only) — deduplicating the near-identical `flushMicrotasks` helper across the two files into a shared test utility was considered and explicitly deferred, per the issue discussion.

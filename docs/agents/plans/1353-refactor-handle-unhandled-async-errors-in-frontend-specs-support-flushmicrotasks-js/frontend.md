# Frontend Plan: Refactor: handle unhandled async errors in frontend/specs/support/flushMicrotasks.js

Main plan: [plan.md](plan.md)

## Overview
`frontend/specs/support/flushMicrotasks.js` is an `async` function whose `for` loop (line 9) Codacy flags with `security-node/detect-unhandled-async-errors`. The `try`/`catch` inside it is dead code (`Promise.resolve()` never rejects), and the `eslint-disable-next-line` comment sits inside the `catch` so it only covers the closing brace, not the flagged line. `frontend/eslint.config.mjs` carries a file-scoped `reportUnusedDisableDirectives: 'off'` override solely to keep that comment from being auto-removed.

## Context
- Call sites: `ResilientRequestSpec.js` (`await flushMicrotasks()`, default `times`) and `RecoverPasswordControllerSpec.js` (`await flushMicrotasks(10)`). Both only `await` the returned promise, so any function returning a `Promise<void>` that settles after roughly `times` microtask ticks is compatible.
- The project's own `eslint-plugin-security-node` cannot run this rule, so the finding can only be confirmed by Codacy after the PR; locally we verify that lint and the specs still pass.

## Implementation Steps

### Step 1 — Rewrite `flushMicrotasks` without `async`
Replace the `async` function with a plain function that builds and returns a promise chain of `times` ticks:

```js
export default function flushMicrotasks(times = 5) {
  let chain = Promise.resolve();
  for (let i = 0; i < times; i += 1) {
    chain = chain.then(() => undefined);
  }
  return chain;
}
```

Remove the `try`/`catch` and the `eslint-disable-next-line` comment. Keep the JSDoc (`@param {number} [times]`, `@returns {Promise<void>}`), adjusting the wording if needed. The default (`5`) and the `Promise<void>` contract stay the same so both call sites keep working unchanged.

### Step 2 — Remove the file-scoped ESLint override
In `frontend/eslint.config.mjs`, delete the config block scoped to `files: ['specs/support/flushMicrotasks.js']` (with `linterOptions: { reportUnusedDisableDirectives: 'off' }`) together with its explanatory comment, since there is no suppression comment left for it to protect.

## Files to Change
- `frontend/specs/support/flushMicrotasks.js` — replace the `async` function/dead `try`/`catch`/misplaced `eslint-disable` comment with a non-`async` `.then()` chain returning `Promise<void>`
- `frontend/eslint.config.mjs` — remove the `specs/support/flushMicrotasks.js` override block and its comment

## CI Checks
- `frontend`: `yarn test` (CI job: frontend tests / `npm run coverage`)
- `frontend`: `yarn lint` (CI job: JS lint / `npm run lint`)

## Notes
- The `.then()` chain takes about one extra microtask tick to settle compared with the previous `await` loop; `ResilientRequestSpec.js` and `RecoverPasswordControllerSpec.js` run through `yarn test` to confirm the specs still behave the same. If a spec turns out to be timing-sensitive, bump that call site's `times` rather than reintroducing `async`.
- Codacy's `detect-unhandled-async-errors` finding can only be verified once the PR is analyzed by Codacy.

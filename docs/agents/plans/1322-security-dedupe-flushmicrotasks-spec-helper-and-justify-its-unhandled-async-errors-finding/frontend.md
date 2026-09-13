# Frontend Plan: Security: dedupe flushMicrotasks spec helper and justify its unhandled-async-errors finding

Main plan: [plan.md](plan.md)

## Overview

`flushMicrotasks(times)` is defined twice, verbatim, in two spec files (differing only in the default `times` value). ESLint's `security-node/detect-unhandled-async-errors` rule flags both copies because of the intentionally empty `catch` block. Extract the helper into the existing `frontend/specs/support/` folder, parameterize `times`, have both specs import it, and add a single justified suppression there instead of two.

## Implementation Steps

### Step 1 — Extract the shared helper

Create `frontend/specs/support/flushMicrotasks.js`, exporting a default (or named) `flushMicrotasks(times = 5)` function with the same body currently duplicated in both spec files (loop `times` iterations, `await Promise.resolve()` inside a `try`/empty `catch`). Keep the existing JSDoc comment (currently only on the `ResilientRequestSpec.js` copy) describing what it does and why the `catch` is needed.

Add exactly one suppression comment directly above the `catch` (or above the function, whichever the linter requires to clear the finding), following the repo's existing convention seen in files like `frontend/assets/js/utils/routing/Route.js` and `frontend/specs/support/preloadTranslations.js`:

```js
// eslint-disable-next-line security-node/detect-unhandled-async-errors -- Promise.resolve() never rejects; this catch exists only to flush pending microtasks in specs.
```

(Confirm the exact rule name/placement by running `npm run lint` after this step — adjust the disable comment's target line if ESLint still flags it.)

### Step 2 — Update both specs to use the shared helper

- `frontend/specs/assets/js/client/ResilientRequestSpec.js`: remove the local `flushMicrotasks` function and its JSDoc, import the new helper instead, and call it exactly as before (`flushMicrotasks(5)` wherever it currently relies on the default, or keep calling it bare if the default stays 5).
- `frontend/specs/assets/js/components/resources/account/pages/controllers/RecoverPasswordControllerSpec.js`: same removal, but this file currently relies on `times = 10` — update its call sites to pass `10` explicitly (e.g. `flushMicrotasks(10)`), since the shared helper's default will be `5`.

Use the same relative-import style already used elsewhere in these spec files (e.g. `RequestClientSpec.js`'s import of a `support/` helper) to reach `frontend/specs/support/flushMicrotasks.js`.

## Files to Change

- `frontend/specs/support/flushMicrotasks.js` — new shared helper (extracted, parameterized by `times`, single justified lint suppression).
- `frontend/specs/assets/js/client/ResilientRequestSpec.js` — remove local `flushMicrotasks`, import and use the shared helper.
- `frontend/specs/assets/js/components/resources/account/pages/controllers/RecoverPasswordControllerSpec.js` — remove local `flushMicrotasks`, import and use the shared helper, passing `10` explicitly.

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`) — confirms the ESLint finding is resolved with no new violations.
- `frontend`: `NODE_OPTIONS='--loader ./specs/support/jsx-loader.mjs' nyc npx jasmine --helper=specs/support/preloadTranslations.js "specs/**/*[sS]pec.js"` (CI job: `jasmine`) — confirms both specs still pass after the refactor.

## Notes

- Only these two spec files use `flushMicrotasks` today (verified via repo-wide search); no other duplicate copies need updating.
- The exact ESLint rule the ESLint suppression comment must target should be confirmed by running the linter locally — the Codacy finding names `security-node/detect-unhandled-async-errors`, but double-check against this repo's installed `eslint-plugin-security-node` version/config before finalizing the comment.

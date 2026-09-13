# Issue: Security: dedupe flushMicrotasks spec helper and justify its unhandled-async-errors finding

## Description
`frontend/specs/assets/js/client/ResilientRequestSpec.js` and `frontend/specs/assets/js/components/resources/account/pages/controllers/RecoverPasswordControllerSpec.js` each define their own copy of a local `flushMicrotasks(times)` helper (identical bodies, differing only in default `times`: 5 vs. 10). ESLint's `security-node/detect-unhandled-async-errors` rule flags both copies — likely because the `catch` block is intentionally empty (with an explanatory comment) since `Promise.resolve()` never actually rejects.

Source: Codacy SRM (SCA/UnexpectedBehaviour), findings [1](https://app.codacy.com/p/880653/issues/index?resultDataId=131514798288) and [2](https://app.codacy.com/p/880653/issues/index?resultDataId=131514798286), repository `darthjee/majora`.

## Problem
- The helper is duplicated verbatim across two spec files, violating the project's "reduce code duplication" contributing guideline (move repeated test setup into a factory function/fixture).
- Because it's duplicated, the same ESLint finding has to be re-triaged/re-suppressed in two places, and will recur again if copy-pasted into a future spec.

## Solution
Extract `flushMicrotasks(times)` into a single shared spec support helper (e.g. `frontend/specs/support/flushMicrotasks.js`, alongside the repo's existing spec-support helpers like `fetchMock.js`/`preloadTranslations.js`), parameterized by `times` with a sensible default. Import it from both `ResilientRequestSpec.js` and `RecoverPasswordControllerSpec.js`, passing each file's current `times` value explicitly at the call site instead of relying on the default. Add one explicit, justified suppression (`// eslint-disable-next-line security-node/detect-unhandled-async-errors -- ...`) on this single copy, following the repo's existing eslint-disable-with-justification convention, instead of the finding needing to be re-triaged per spec file.

## Benefits
- Single source of truth for the helper; no more copy-pasted duplication across spec files.
- One documented, justified lint suppression instead of two — nothing to re-triage when the helper is reused in future specs.
- Aligns with the project's existing contributing guideline on reducing test setup duplication.

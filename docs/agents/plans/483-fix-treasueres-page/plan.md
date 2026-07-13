# Plan: Fix treasures page

Issue: [483-fix-treasueres-page.md](../../issues/483-fix-treasueres-page.md)

## Overview
Fix a runtime crash on the superuser treasures index page (`/#/treasures`) caused by a stray extra `null` argument passed to `TreasuresController`'s constructor, and add a regression test that renders the real page component so this class of argument-mismatch bug is caught in the future.

## Context
`Treasures.jsx` calls:

```js
new TreasuresController(setTreasures, setPagination, setLoading, setError, null, null, setIsSuperUser)
```

but `TreasuresController`'s constructor only accepts 6 positional parameters: `setTreasures, setPagination, setLoading, setError, client, setIsSuperUser`. The extra `null` shifts `setIsSuperUser` out of its slot — `client` correctly resolves to `null` (5th arg), but the 6th arg (`null`) is taken as `setIsSuperUser`, overriding its `Noop.noop` default, and the real `setIsSuperUser` React setter becomes a discarded 7th argument.

Later, `buildEffect()` calls `safeSet(this.setIsSuperUser, true)` with `this.setIsSuperUser === null`, throwing `TypeError: null is not a function` — matching the reported production stacktrace (`buildSafeSetter` / `buildEffect`).

The bug was introduced in #288 when `setIsSuperUser` wiring was added by copying the sibling `GameTreasuresController`/`GameTreasues.jsx` pattern, leaving one extra erroneous `null`. `TreasuresControllerSpec.js` only exercises the controller directly with correct arguments, so it never caught the page component's miscall.

## Implementation Steps

### Step 1 — Fix the call site
In `frontend/assets/js/components/resources/treasure/pages/Treasures.jsx`, remove the stray extra `null` so the constructor call becomes:

```js
new TreasuresController(setTreasures, setPagination, setLoading, setError, null, setIsSuperUser)
```

### Step 2 — Add a page-level regression test
Add (or extend) a Jasmine spec that renders `Treasures.jsx` itself (not just `TreasuresController` in isolation) and asserts the page loads without throwing, `AccessStore.ensureSuperUser()` resolving to a superuser results in the superuser-only UI/controls rendering, and the treasures index fetch completes and renders data. This closes the coverage gap that let the component/controller argument mismatch ship unnoticed. Follow existing conventions from sibling page specs (e.g. `GameTreasues.jsx`'s spec, if one renders the full page) for structure and mocking of `AccessStore`/`GenericClient`.

## Files to Change
- `frontend/assets/js/components/resources/treasure/pages/Treasures.jsx` — remove the stray extra `null` argument in the `TreasuresController` instantiation.
- `frontend/assets/js/components/resources/treasure/pages/Treasures.spec.jsx` (or wherever sibling page specs live) — add/extend a test that renders the full page component to catch this class of bug going forward.

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes
- The cold-start/502 theory raised in the original issue report is not the cause — the bug is deterministic and reproducible on every superuser page load regardless of server warm-up state.
- No backend, proxy, infra, or translation changes are needed; this is a frontend-only fix.

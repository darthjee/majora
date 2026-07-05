# Plan: Fix JS issue: Disallow Empty Functions

Issue: [302-fix-js-issue--disallow-empty-functions.md](../issues/302-fix-js-issue--disallow-empty-functions.md)

## Overview

Introduce a single shared `Noop` utility (`frontend/assets/js/utils/Noop.js`), replace every inline `() => {}` no-op literal across `frontend/assets` and `frontend/specs` with `Noop.noop`, and enable ESLint's `no-empty-function` rule so new inline no-ops can't be reintroduced.

## Context

`frontend/eslint.config.mjs` does not enable `no-empty-function`. A codebase scan found roughly 170+ occurrences of `() => {}` across ~74 files in `assets/js` and `specs`: mostly default parameter values for optional callback props (e.g. `setFieldErrors = () => {}`), `.catch(() => {})` handlers, and test doubles/spies (including nested forms like `() => () => {}` used for `buildEffect` mocks). This is entirely a `frontend/` concern — no backend, infra, or proxy changes are involved.

## Implementation Steps

### Step 1 — Add the `Noop` utility

Create `frontend/assets/js/utils/Noop.js` following the existing static-method util class convention used by `frontend/assets/js/utils/AuthEvents.js` and `frontend/assets/js/utils/HashRouteResolver.js`:

```javascript
/**
 * Utility providing a shared no-op function, to be used instead of
 * inline `() => {}` literals wherever a placeholder callback is needed.
 */
export default class Noop {
  /**
   * A function that does nothing.
   *
   * @returns {void}
   */
  static noop() {}
}
```

Follow the project's JSDoc lint rules (`jsdoc/require-jsdoc`, `require-description`, etc. from `frontend/eslint.config.mjs`) so the new file itself passes lint.

Add a matching spec at `frontend/specs/assets/js/utils/NoopSpec.js` (mirroring `frontend/specs/assets/js/utils/AuthEventsSpec.js`) asserting `Noop.noop` is a function and that calling it does not throw and returns `undefined`.

### Step 2 — Replace inline no-ops in production code (`assets/js`)

Search for `() => {}` under `frontend/assets` and replace every occurrence with `Noop.noop`, importing `Noop` in each file that needs it. Cases include, non-exhaustively:
- Default parameter values, e.g. `setFieldErrors = () => {}` in controllers such as `GameNewController.js`, `GameEditController.js`, `BaseCharacterEditController.js`, `HeaderController.js`, `GameController.js`, etc. → `setFieldErrors = Noop.noop`.
- `.catch(() => {})` handlers, e.g. `PcCharacterPhotosController.js`, `NpcCharacterPhotosController.js`, `PcCharacterPhotos.jsx`, `NpcCharacterPhotos.jsx` → `.catch(Noop.noop)`.
- Object literal handlers, e.g. `App.jsx`'s `addEventListener: () => {}` / `removeEventListener: () => {}` → `addEventListener: Noop.noop`.
- Constructor call sites passing an inline no-op as an argument, e.g. `new GameNewController(() => {}, setFieldErrors)` in `GameNew.jsx`, `TreasureNew.jsx`, `GameSessionNew.jsx` → `new GameNewController(Noop.noop, setFieldErrors)`.

Do not change behavior — every replacement must be a drop-in equivalent (same arity expectations; `Noop.noop` takes any arguments and returns `undefined`, same as `() => {}`).

### Step 3 — Replace inline no-ops in specs

Search for `() => {}` under `frontend/specs` and replace with `Noop.noop`, importing `Noop` from the appropriate relative path (matching the existing relative-import style used in specs, e.g. `../../../../assets/js/utils/Noop.js`). Cases include:
- Simple stand-in callback/prop values passed to components/controllers under test.
- Nested no-op-returning mocks such as `spyOn(XController.prototype, 'buildEffect').and.returnValue(() => () => {})` → `.and.returnValue(() => Noop.noop)`.

### Step 4 — Enable the ESLint rule

Add `'no-empty-function': 'error'` to the `rules` block in `frontend/eslint.config.mjs` (the shared block that also holds `no-unused-vars`, `eqeqeq`, etc. — not the test-only override block), so it applies to both `assets` and `specs`.

### Step 5 — Verify

Run lint and the full test suite locally (see CI Checks below) and fix any remaining violations (e.g. missed occurrences, or newly-empty arrow functions the rule flags that weren't part of the original `() => {}` scan, such as multi-statement bodies reduced to nothing — unlikely here but worth a clean pass).

## Files to Change

- `frontend/assets/js/utils/Noop.js` — new shared no-op utility class.
- `frontend/specs/assets/js/utils/NoopSpec.js` — new spec for the utility.
- `frontend/eslint.config.mjs` — add `'no-empty-function': 'error'` to the main rules block.
- All ~74 files currently containing inline `() => {}` under `frontend/assets/js/**` and `frontend/specs/**` (found via `grep -rl '() => {}' assets specs` from the `frontend/` folder) — replace inline no-ops with `Noop.noop` (or `() => Noop.noop` for the nested `buildEffect` mock case) and add the corresponding import.

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes

- This is a mechanical, repository-wide substitution — the risk is missing an occurrence or subtly changing arity/behavior at a call site. After the sweep, re-run `grep -rn '() => {}' assets specs` (from `frontend/`) to confirm zero remaining matches before declaring the work done.
- `no-empty-function` also flags empty arrow functions with a block body containing only whitespace/comments and empty regular function declarations/expressions — double check none of those exist outside the `() => {}` literal count already found, so enabling the rule doesn't surface unrelated new violations.
- Single-agent issue: only the `frontend` agent is involved; no shared contracts with other agents.

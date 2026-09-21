# Frontend Plan: Refactor: reduce buildHeaderControllers' parameter count below the complexity limit

Main plan: [plan.md](plan.md)

## Overview
`buildHeaderControllers` in `frontend/assets/js/components/common/header/hooks/useHeaderControllers.js` destructures 11 state setters in its signature, and Lizard counts each as a parameter (limit 8). Replace the single flat object with three plain object arguments, one per controller, destructured in the function body rather than in the signature.

## Context
- `buildHeaderControllers` is only called from `useHeaderControllers` (same file); it is also exported by name, but no spec or other module references it.
- `useHeaderControllers({ gameSlug, ...setters })` is called from `Header.jsx` with the flat setters from `useHeaderState`. That public signature stays unchanged, as do `Header.jsx` and `useHeaderState`.
- `HeaderController`'s own 12-positional-arg constructor (with `undefined` placeholders) is out of scope and stays as is.
- Follows the option-object approach of #1324, #1325 and #1359.

## Implementation Steps

### Step 1 — Change `buildHeaderControllers`' signature
New signature:

```js
function buildHeaderControllers(headerSetters, viewAsSetters, gameAccessSetters)
```

Destructure inside the body (not in the signature, so Lizard doesn't count each key):

- `headerSetters` (for `HeaderController`): `setLoggedIn`, `setShowModal`, `setTestEmailStatus`, `setIsSuperUser`, `setIsStaff`, `setRoute`, `setPendingApproval`, `setDomainConfig`
- `viewAsSetters` (for `HeaderViewAsController`): `setCanViewAs`, `setShowViewAsModal`
- `gameAccessSetters` (for `HeaderGameAccessController`): `setGameAccess`

The constructor calls keep passing the same arguments in the same order (including the `undefined` placeholders for `HeaderController`). Update the JSDoc: document the three params (`@param {object} headerSetters`, etc.) with their `headerSetters.setX` entries instead of the 11 flat `params.setX` lines. Keep the function under 50 lines (the complexity limit tightened in #1357/#1412).

### Step 2 — Group the setters inside `useHeaderControllers`
In the `useMemo` callback, split the flat `setters` (from `{ gameSlug, ...setters }`) into the three groups and call `buildHeaderControllers(headerSetters, viewAsSetters, gameAccessSetters)`. Options for the grouping (pick whichever keeps the hook shortest and clearest): pick the keys explicitly with a small helper, or destructure them from `setters` in the callback. `useHeaderControllers`' own signature and return value do not change, and the `useMemo`'s empty dependency array and its `eslint-disable` comment stay. Keep the hook's JSDoc accurate (it still forwards the flat setters plus `gameSlug`), and adjust the "forwarded to `buildHeaderControllers`" wording to say they're regrouped per controller.

## Files to Change
- `frontend/assets/js/components/common/header/hooks/useHeaderControllers.js` — new three-argument `buildHeaderControllers` signature, regrouping in `useHeaderControllers`, updated JSDoc for both

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`) — existing `HeaderSpec`, `useHeaderStateSpec` and `useHeaderAuthEffectSpec` must pass unmodified

## Notes
- No spec covers `buildHeaderControllers` or `useHeaderControllers` directly today; `HeaderSpec` exercises them through `Header`. If a direct spec is wanted it belongs in a separate issue; this one must not modify existing specs.
- After merge, confirm Codacy's Lizard `parameter-count-medium` finding for `useHeaderControllers.js` clears. Lizard's handling of destructuring in signatures is why the keys are destructured in the body.

# Issue: Refactor: reduce buildHeaderControllers' parameter count below the complexity limit

## Description
Codacy's Lizard scan (`parameter-count-medium`, Complexity, Warning severity) flags `buildHeaderControllers` in `frontend/assets/js/components/common/header/hooks/useHeaderControllers.js:27` for having 11 parameters (limit is 8). The function takes a single destructured object whose 11 keys are all state setters (`setLoggedIn`, `setShowModal`, `setTestEmailStatus`, `setIsSuperUser`, `setIsStaff`, `setRoute`, `setPendingApproval`, `setDomainConfig`, `setCanViewAs`, `setShowViewAsModal`, `setGameAccess`). Lizard counts each destructured key in the signature as a parameter, so the keys have to move out of the signature.

## Expected Behavior
- [ ] `buildHeaderControllers` no longer exceeds 8 parameters
- [ ] `Header` behavior is unchanged and existing specs pass unmodified
- [ ] `Header.jsx`, `useHeaderState` and `useHeaderControllers`' public signature (flat setters + `gameSlug`) are unchanged
- [ ] Codacy's Lizard `parameter-count-medium` finding clears for this file

## Solution
Change `buildHeaderControllers` to take three plain object arguments, one per controller, destructured in the function body rather than in the signature:

```js
buildHeaderControllers(headerSetters, viewAsSetters, gameAccessSetters)
```

- `headerSetters` (for `HeaderController`): `setLoggedIn`, `setShowModal`, `setTestEmailStatus`, `setIsSuperUser`, `setIsStaff`, `setRoute`, `setPendingApproval`, `setDomainConfig`
- `viewAsSetters` (for `HeaderViewAsController`): `setCanViewAs`, `setShowViewAsModal`
- `gameAccessSetters` (for `HeaderGameAccessController`): `setGameAccess`

The grouping happens inside `useHeaderControllers`, which keeps accepting the flat setters plus `gameSlug` from `Header` and builds the three groups before calling `buildHeaderControllers`. Update the JSDoc of both functions accordingly. This follows the option-object approach used in #1324, #1325 and #1359. The frontend agent owns the change.

Out of scope: `HeaderController`'s own 12-positional-arg constructor (with `undefined` placeholders) is left as is; raise a separate issue if Codacy flags it.

## Benefits
- Clearer call site: each controller's dependencies are grouped together
- Clears a Codacy complexity warning

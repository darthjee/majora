# Issue: Fix treasures page

## Description
Navigating to the superuser treasures index page (`/#/treasures`) throws an uncaught runtime error and the page never finishes loading.

## Problem
`Treasures.jsx` instantiates `TreasuresController` with an extra stray `null` argument:

```js
new TreasuresController(setTreasures, setPagination, setLoading, setError, null, null, setIsSuperUser)
```

but the constructor only accepts 6 parameters (`setTreasures, setPagination, setLoading, setError, client, setIsSuperUser`). Positionally, the 5th arg (`null`) correctly becomes `client`, but the 6th arg (`null`) is taken as `setIsSuperUser` (overriding its `Noop.noop` default), and the real `setIsSuperUser` React state setter is passed as a discarded 7th argument.

When `buildEffect()` later calls `safeSet(this.setIsSuperUser, true)`, `this.setIsSuperUser` is `null`, so invoking it throws `TypeError: null is not a function` — which matches the reported production stacktrace (`buildSafeSetter` / `buildEffect`, minified to "r is not a function").

This is a deterministic bug in the call site's argument list, reproducible on every load for a superuser regardless of server warm-up state — it is unrelated to the cold-start/502 theory raised when the issue was opened.

The bug was introduced in #288 (Fix #276 — Add treasure photos), which added the `setIsSuperUser` wiring by copying the pattern from the sibling `GameTreasuresController`/`GameTreasues.jsx` (which correctly passes 6 args) but left in one extra erroneous `null`. `TreasuresControllerSpec.js` only exercises the controller directly with correct arguments, so it never caught the page component's miscall.

## Expected Behavior
The treasures page loads successfully for superusers: it fetches and renders the treasures index without throwing, and the superuser flag is set correctly so page controls render as expected.

## Solution
Remove the stray extra `null` in `Treasures.jsx`'s `TreasuresController` instantiation so `setIsSuperUser` lands in its correct (6th) positional slot:

```js
new TreasuresController(setTreasures, setPagination, setLoading, setError, null, setIsSuperUser)
```

Add a regression test that renders `Treasures.jsx` (or otherwise exercises the real call site, not just `TreasuresController` in isolation) to catch future argument-order/count mismatches between the component and its controller.

## Benefits
Restores the treasures index page to working order for superusers, and closes the test gap that let a component/controller argument mismatch ship unnoticed.

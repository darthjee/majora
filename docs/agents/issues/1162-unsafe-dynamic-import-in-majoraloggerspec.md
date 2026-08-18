# Issue: Unsafe dynamic import in MajoraLoggerSpec

## Description
Codacy (ESLint `no-unsanitized/method`) flags the dynamic `import()` call in `frontend/specs/assets/js/utils/logging/MajoraLoggerSpec.js` because its argument is a template literal rather than a static string literal, even though the module path itself never varies.

## Problem
`MajoraLoggerSpec.js` defines a helper, `freshMajoraLogger()`, that re-imports `MajoraLogger.js` with a cache-busting query string so each test re-evaluates the module's top-level code (picking up the current `VITE_FRONTEND_LOG_LEVEL`):

```js
const MODULE_PATH = '../../../../../assets/js/utils/logging/MajoraLogger.js';
const loaded = await import(`${MODULE_PATH}?spec=${Date.now()}-${Math.random()}`);
```

`MODULE_PATH` is a fixed constant — the only dynamic part of the specifier is the `?spec=...` query string appended purely to defeat Node's module cache. No external or user-controlled input ever reaches this call, and no other spec file in the repo uses this pattern (confirmed via search), so the finding is a false positive rather than a real injection risk. However, the rule cannot statically verify that, since the argument as a whole is a template literal.

## Expected Behavior
The Codacy finding should be resolved by documenting why the dynamic segment is safe, without changing the cache-busting behavior the test relies on.

## Solution
Add a justified inline suppression directly above the `import()` call, e.g.:

```js
// eslint-disable-next-line no-unsanitized/method -- MODULE_PATH is a fixed
// local constant; only the cache-busting query string (?spec=...) is dynamic,
// and it never comes from external/user input.
const loaded = await import(`${MODULE_PATH}?spec=${Date.now()}-${Math.random()}`);
```

This follows the existing `eslint-disable-next-line` convention already used elsewhere in `frontend/specs` (e.g. `no-empty-function` in `AcquireFactionTabSpec.js`). Rewriting to a fully static import or an allow-list is not needed: there's no external input branching the specifier, and a static import would defeat the fresh-module-reload purpose of the helper.

## Benefits
- Clears the Codacy finding without changing test behavior.
- Documents, for future readers, exactly why this dynamic import is safe.
- Keeps the module-cache-busting technique intact for future log-level tests.

# Frontend Plan: Unsafe dynamic import in MajoraLoggerSpec

Main plan: [plan.md](plan.md)

## Overview
`frontend/specs/assets/js/utils/logging/MajoraLoggerSpec.js` re-imports `MajoraLogger.js` on every test via a dynamic `import()` whose argument is a template literal, so Codacy's ESLint `no-unsanitized/method` flags it. Investigation confirmed the module path segment (`MODULE_PATH`) is a fixed local constant — the only dynamic part of the specifier is a `?spec=<timestamp>-<random>` suffix appended purely to bust Node's module cache between tests, with no external or user-controlled input reaching the call. No other spec file in the repo uses this pattern. The fix is a justified inline suppression, not a rewrite (a static import would defeat the fresh-module-reload behavior these tests rely on).

## Context
```js
const MODULE_PATH = '../../../../../assets/js/utils/logging/MajoraLogger.js';

async function freshMajoraLogger() {
  const loaded = await import(`${MODULE_PATH}?spec=${Date.now()}-${Math.random()}`);
  return loaded.default;
}
```

The codebase already has a convention for justified inline lint suppressions in spec files, e.g. `// eslint-disable-next-line no-empty-function` in `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/AcquireFactionTabSpec.js`.

## Implementation Steps

### Step 1 — Add a justified suppression above the dynamic import
In `frontend/specs/assets/js/utils/logging/MajoraLoggerSpec.js`, add an `eslint-disable-next-line no-unsanitized/method` comment directly above the `import()` call inside `freshMajoraLogger()`, explaining why it's safe:

```js
// eslint-disable-next-line no-unsanitized/method -- MODULE_PATH is a fixed
// local constant; only the cache-busting query string (?spec=...) is dynamic,
// and it never comes from external/user input.
const loaded = await import(`${MODULE_PATH}?spec=${Date.now()}-${Math.random()}`);
```

Do not change `MODULE_PATH`, the query-string cache-busting technique, or any test behavior — this is a documentation/suppression-only change.

### Step 2 — Verify no other occurrences need the same treatment
Confirm (already checked during planning) that no other spec file uses a template-literal `import()`:

```bash
grep -rn 'import(\`' frontend/specs
```

Only `MajoraLoggerSpec.js` should match. If a new occurrence has appeared since planning, apply the same justified-suppression pattern there too rather than leaving it unaddressed.

## Files to Change
- `frontend/specs/assets/js/utils/logging/MajoraLoggerSpec.js` — add the justified `eslint-disable-next-line no-unsanitized/method` comment above the dynamic `import()` call in `freshMajoraLogger()`.

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`) — confirms the Codacy/ESLint finding is resolved.
- `frontend`: `npm test` (CI job: `jasmine`) — confirms `MajoraLoggerSpec.js` still passes unchanged.

## Notes
- This is a suppression, not a code behavior change — the underlying pattern (dynamic cache-busting query string on an otherwise-static import path) remains in place because it's required for the test's fresh-module-reload technique to work.
- If the target Codacy/ESLint config does not actually run the `no-unsanitized` plugin locally (it isn't present in `frontend/eslint.config.mjs` as of this plan), the `eslint-disable-next-line` comment is inert locally but still recognized by Codacy's own ESLint-based scan, which is what raised the original finding.

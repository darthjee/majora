# Frontend Plan: Refactor: StlModelFiltersControllerSpec's buildController has cyclomatic complexity 17

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Replace the per-field `??` chain with a single default-merge
In `frontend/specs/assets/js/components/resources/stl_model/pages/elements/controllers/StlModelFiltersControllerSpec.js`, rewrite `buildController` so the eight `??` fallbacks collapse into one expression, e.g.:

```js
function buildController(overrides = {}) {
  const {
    setName = jasmine.createSpy('setName'),
    setType = jasmine.createSpy('setType'),
    setSize = jasmine.createSpy('setSize'),
    setRaces = jasmine.createSpy('setRaces'),
    setRoles = jasmine.createSpy('setRoles'),
    setSources = jasmine.createSpy('setSources'),
    setCollections = jasmine.createSpy('setCollections'),
    setTags = jasmine.createSpy('setTags'),
  } = overrides;

  return new StlModelFiltersController(
    setName, setType, setSize, setRaces, setRoles, setSources, setCollections, setTags,
  );
}
```

Destructuring with defaults (or an equivalent spread-merge) removes the eight standalone `??` branches Lizard was counting, while keeping the function's external behavior — same signature, same per-field override semantics, same spy defaults — identical. Do not touch `StlModelFiltersController`'s own constructor; this is a test-helper-only change.

## Files to Change
- `frontend/specs/assets/js/components/resources/stl_model/pages/elements/controllers/StlModelFiltersControllerSpec.js` — rewrite `buildController` to remove the per-field `??` chain.

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`) — the spec's own existing `it` blocks must keep passing unchanged.
- `frontend`: `npm run lint` (CI job: `frontend-checks`) — confirms the cyclomatic-complexity/ESLint finding is resolved and no new lint issues are introduced.

## Notes
- No behavior change is expected in any test in this file — this is purely a complexity/readability refactor of the test builder.

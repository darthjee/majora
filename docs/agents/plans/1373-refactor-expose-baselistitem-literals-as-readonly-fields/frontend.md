# Frontend Plan: Refactor: expose BaseListItem literals as readonly fields

Main plan: [plan.md](plan.md)

## Overview
Two getters in `BaseListItem` (`formattedValue`, `availabilityText`) return a constant `null` and are flagged by `@typescript-eslint/class-literal-property-style`. They are overridden by getters in `TreasureListItem`, `CollectionListItem` and `GameCommonItemListItem`. A class field in the base class would create an own instance property that shadows those prototype getters, making the subclasses return `null` — so the fix is to keep the getters and suppress the rule on those two lines.

## Implementation Steps

### Step 1 — Suppress the rule on the two getters
In `frontend/assets/js/components/common/list_types/BaseListItem.js`, add a `// eslint-disable-next-line @typescript-eslint/class-literal-property-style -- <reason>` comment directly above `get formattedValue()` and `get availabilityText()` (placed between the JSDoc block and the getter, so the directive applies to the getter line). The reason should state that subclasses override the accessor with getters and a class field would shadow the override. Follow the `// eslint-disable-next-line <rule> -- <reason>` convention already used in `Route.js` and `MajoraLogger.js`. Do not change any getter body, subclass or spec.

### Step 2 — Verify
From `frontend/`, run `npm run lint` and confirm it still passes. `@typescript-eslint` is not a dependency of this project, so check that the directive does not raise an error (rule-not-found) and, if ESLint 9's default `reportUnusedDisableDirectives: "warn"` emits an "unused directive" warning for it, that this is not treated as a failure (`npm run lint` has no `--max-warnings`). If it does fail or warn noisily, fall back to a `/* eslint-disable ... */` / Codacy-side ignore for those lines and note it. Then run the BaseListItem spec and the subclass list-item specs (`npm test`, or the `specs/assets/js/components/common/list_types/*ListItemSpec.js` subset) to confirm no behavior change.

## Files to Change
- `frontend/assets/js/components/common/list_types/BaseListItem.js` — add the two `eslint-disable-next-line` directives above `formattedValue` (line 43) and `availabilityText` (line 54).

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm test` (CI job: `jasmine`)

## Notes
- Do not convert to class fields: it would silently break `TreasureListItem`, `CollectionListItem` and `GameCommonItemListItem`, and through them `ListPageHelper`, `TreasureCardHelper` and `GameTreasureHelper`.
- The Codacy finding can only be confirmed as cleared after the PR is analyzed by Codacy; locally, only lint and specs can be checked.

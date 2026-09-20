# Frontend Plan: Refactor: avoid assignment-in-operand in frontend/assets/js/components/common/list_types/listTypeConfig.js

Main plan: [plan.md](plan.md)

## Overview
Codacy's PMD `AssignmentInOperand` flags `listTypeConfig.js:73`, which is the `window.location.hash = ...` statement inside the `onClick` arrow function of the secondary "Edit" button built by `buildActionBarProps`. It is already a standalone statement, so this looks like a false positive triggered by the assignment being nested in an arrow function inside an object literal inside a ternary. Extracting the assignment into a named helper removes the nesting.

## Context
The existing spec `frontend/specs/assets/js/components/common/list_types/listTypeConfig/treasuresSpec.js` (around line 96) already asserts that clicking the secondary edit button sets `window.location.hash` to `#/games/demo/treasures/1/edit`, so behavior is covered without new specs.

## Implementation Steps

### Step 1 — Extract the navigation into a named helper
In `listTypeConfig.js`, add a small JSDoc-documented function above `buildActionBarProps` (matching the file's existing doc style), e.g. `navigateToTreasureEdit(gameSlug, treasureId)`, that assigns `window.location.hash = \`#/games/${gameSlug}/treasures/${treasureId}/edit\``. Replace the inline assignment in the secondary button's `onClick` with `onClick: () => navigateToTreasureEdit(context.gameSlug, item.data.id)`. Keep the helper module-private (not exported), like the other `build*`/`fetch*` helpers in the file that are not exported.

### Step 2 — Verify
Run the frontend specs and lint, and confirm the existing `treasuresSpec.js` edit-button navigation spec still passes unchanged. After the PR is pushed, check whether Codacy's `AssignmentInOperand` finding for this file clears; if it does not, follow up by suppressing it as a false positive (a separate follow-up, not part of this change).

## Files to Change
- `frontend/assets/js/components/common/list_types/listTypeConfig.js` — extract the `window.location.hash` assignment into a named helper and call it from the Edit button's `onClick`

## CI Checks
- `frontend`: `yarn lint` (CI job: `frontend-checks`)
- `frontend`: `yarn test` (CI job: `jasmine`)

## Notes
- The finding is likely a PMD false positive; the extraction is a best-effort fix and its effectiveness can only be confirmed after Codacy re-scans the PR.
- No spec changes are expected; if the helper is not exported, it is covered through the existing `treasuresSpec.js` navigation spec.

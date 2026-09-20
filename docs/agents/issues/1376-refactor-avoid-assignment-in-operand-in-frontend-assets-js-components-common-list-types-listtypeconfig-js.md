# Issue: Refactor: avoid assignment-in-operand in frontend/assets/js/components/common/list_types/listTypeConfig.js

## Description
Codacy's PMD scan (`AssignmentInOperand`, CodeStyle, Info severity) flags `frontend/assets/js/components/common/list_types/listTypeConfig.js:73`, reporting an assignment used inside an operand (e.g. inside a condition or expression).

## Problem
Line 73 is the `window.location.hash = `#/games/${context.gameSlug}/treasures/${item.data.id}/edit`;` statement inside the `onClick` arrow-function block body of the secondary "Edit" button built by `buildActionBarProps`. It is already a standalone statement — not an assignment nested in a condition or expression — so the finding looks like a PMD false positive, probably caused by the assignment sitting in an arrow function nested inside an object literal inside a ternary.

## Expected Behavior
Codacy's PMD `AssignmentInOperand` finding no longer appears for `listTypeConfig.js`, without changing the runtime behavior of the Edit button (navigating to the game-scoped treasure edit form).

## Solution
Extract the navigation into a small named helper in `listTypeConfig.js` (e.g. `navigateToTreasureEdit(gameSlug, treasureId)`) that performs the `window.location.hash` assignment, and have the Edit button's `onClick` call it, so the assignment is no longer nested inside the object literal/ternary. If Codacy still flags the file after the PR is scanned, follow up by suppressing the finding as a false positive.

## Acceptance criteria
- [ ] The `window.location.hash` assignment is moved out of the nested `onClick` arrow function into a named helper
- [ ] The Edit button still navigates to `#/games/<gameSlug>/treasures/<id>/edit`
- [ ] Existing specs under `frontend/specs/assets/js/components/common/list_types/listTypeConfig/` (e.g. `treasuresSpec.js`) still pass
- [ ] Codacy's PMD `AssignmentInOperand` finding clears for this file once the PR is scanned (otherwise suppress it as a false positive)

## Benefits
Clears the Codacy finding and keeps `buildActionBarProps` easier to read.

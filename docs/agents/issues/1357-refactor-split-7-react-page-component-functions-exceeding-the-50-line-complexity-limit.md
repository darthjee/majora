# Issue: Refactor: split 7 React page/component functions exceeding the 50-line complexity limit

## Description

Codacy's Lizard scan (`nloc-medium`, Complexity, Warning severity) flags 7 functions across the codebase as exceeding the 50-line-of-code guideline (51–64 lines each), making them harder to read, test, and safely modify in one pass:

- `frontend/assets/js/components/common/header/Header.jsx:29` — `Header` (58 lines)
- `crawler/navi-extension/src/backend/enqueue.js:41` — `buildResource` (64 lines)
- `frontend/assets/js/components/resources/game/pages/GameEdit.jsx:32` — `GameEdit` (51 lines)
- `frontend/assets/js/components/resources/common_item/pages/GameCommonItemNew.jsx:19` — `GameCommonItemNew` (51 lines)
- `frontend/assets/js/components/resources/stl_model/pages/StlModelNew.jsx:45` — `StlModelNew` (56 lines)
- `frontend/assets/js/components/resources/document/pages/GameDocument.jsx:36` — `GameDocument` (54 lines)
- `frontend/assets/js/components/resources/common_item/pages/GameCommonItemEdit.jsx:23` — `GameCommonItemEdit` (54 lines)

This spans two ownership areas: the six `frontend/` files belong to the **frontend** agent, and `crawler/navi-extension/src/backend/enqueue.js` belongs to the **crawler** agent.

## Expected Behavior

- [ ] Each of the 7 listed functions is at or under 50 lines of code
- [ ] No behavior change — existing specs for these components still pass
- [ ] Codacy's Lizard `nloc-medium` finding count drops to 0 for these files

## Solution

For each function listed above, extract cohesive chunks (form setup, effect logic, render sections, resource-building sub-steps, etc.) into smaller helper components/hooks/functions so each one drops back under 50 lines. No behavior change is expected — this is a pure structural refactor, kept purely mechanical so existing specs continue to pass unmodified.

## Benefits

- Each function reads, tests, and can be safely modified in one pass
- Codacy's Lizard `nloc-medium` finding count drops to 0 for these files
- No behavior change for end users

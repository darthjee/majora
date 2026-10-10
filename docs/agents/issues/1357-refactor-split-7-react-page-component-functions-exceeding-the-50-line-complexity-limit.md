# Refactor: split 7 React page/component functions exceeding the 50-line complexity limit

## Context

Codacy's Lizard scan (`nloc-medium`, Complexity, Warning severity) flags 7 functions across the frontend as exceeding the 50-line-of-code guideline (51-64 lines each), making them harder to read, test, and safely modify in one pass.

## What needs to be done

Frontend: for each function below, extract cohesive chunks (form setup, effect logic, render sections, etc.) into smaller helper components/hooks so each function drops back under 50 lines:

- frontend/assets/js/components/common/header/Header.jsx:29 — `Header` (58 lines)
- crawler/navi-extension/src/backend/enqueue.js:41 — `buildResource` (64 lines)
- frontend/assets/js/components/resources/game/pages/GameEdit.jsx:32 — `GameEdit` (51 lines)
- frontend/assets/js/components/resources/common_item/pages/GameCommonItemNew.jsx:19 — `GameCommonItemNew` (51 lines)
- frontend/assets/js/components/resources/stl_model/pages/StlModelNew.jsx:45 — `StlModelNew` (56 lines)
- frontend/assets/js/components/resources/document/pages/GameDocument.jsx:36 — `GameDocument` (54 lines)
- frontend/assets/js/components/resources/common_item/pages/GameCommonItemEdit.jsx:23 — `GameCommonItemEdit` (54 lines)

## Acceptance criteria

- [ ] Each of the 7 listed functions is at or under 50 lines of code
- [ ] No behavior change — existing specs for these components still pass
- [ ] Codacy's Lizard `nloc-medium` finding count drops to 0 for these files

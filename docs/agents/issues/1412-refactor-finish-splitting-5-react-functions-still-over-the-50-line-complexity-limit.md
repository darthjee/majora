# Issue: Refactor: finish splitting 5 React functions still over the 50-line complexity limit

## Description
Codacy's Lizard scan (`nloc-medium`, Complexity, Warning severity) still flags 5 React functions as exceeding the 50-line-of-code guideline. Issue #1357 shrank them but did not bring them under the limit:

- `frontend/assets/js/components/common/header/Header.jsx:28` — `Header` (53 lines)
- `frontend/assets/js/components/resources/game/pages/GameEdit.jsx:18` — `GameEdit` (51 lines)
- `frontend/assets/js/components/resources/document/pages/GameDocument.jsx:35` — `GameDocument` (53 lines)
- `frontend/assets/js/components/resources/stl_model/pages/StlModelNew.jsx:47` — `StlModelNew` (54 lines)
- `frontend/assets/js/components/resources/common_item/pages/GameCommonItemEdit.jsx:24` — `GameCommonItemEdit` (54 lines)

## Expected Behavior
- [ ] Each of the 5 functions is at or under 50 lines of code
- [ ] No behavior change — existing specs still pass unmodified
- [ ] Codacy's Lizard `nloc-medium` finding count drops to 0 for these files

## Solution
Extract further cohesive chunks (form setup, effect logic, render sections) into small helper components/hooks/functions so each function drops under 50 lines. Purely structural and mechanical. Frontend agent owns the change.

## Benefits
- Each function reads, tests and changes in one pass
- Clears the last `nloc-medium` findings in the frontend


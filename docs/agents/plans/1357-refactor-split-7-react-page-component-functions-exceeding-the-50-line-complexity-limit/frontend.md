# frontend Plan: Refactor: split 7 React page/component functions exceeding the 50-line complexity limit

Main plan: [plan.md](plan.md)

## Shared contracts

None — every step below is self-contained to its own file(s) under `frontend/`. Step 3 introduces one hook (`usePhotoPreviewUrl`) that steps 4 and 5 both consume; that dependency is internal to this agent's own work, not a cross-agent contract.

## Steps

- [01 — Extract Header's controller/effect wiring into a hook](frontend/01-header.md)
- [02 — Extract GameEdit's field-sync/redirect effect into a hook](frontend/02-game-edit.md)
- [03 — Add a shared usePhotoPreviewUrl hook](frontend/03-shared-photo-preview-hook.md)
- [04 — Apply usePhotoPreviewUrl in GameCommonItemNew](frontend/04-game-common-item-new.md)
- [05 — Apply usePhotoPreviewUrl and extract tag handling in StlModelNew](frontend/05-stl-model-new.md)
- [06 — Extract GameDocument's path-building into a helper](frontend/06-game-document.md)
- [07 — Extract GameCommonItemEdit's field-sync effect into a hook](frontend/07-game-common-item-edit.md)

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run test` (CI job: `jasmine`, which runs the same specs via `npm run coverage`)

## Notes

- Every step is a pure structural extraction — no prop shapes, exported component names, or rendered output change. Run the affected spec file(s) after each step before moving to the next.
- After each extraction, check the resulting function's line count (Codacy's Lizard `nloc-medium` counts non-comment lines within the function body). If a step's extraction doesn't bring the function under 50, pull out one more cohesive chunk the same way (e.g. inline handler callbacks) rather than leaving it over the limit.

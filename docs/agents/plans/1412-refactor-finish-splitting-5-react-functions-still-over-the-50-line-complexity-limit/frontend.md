# Frontend Plan: Refactor: finish splitting 5 React functions still over the 50-line complexity limit

Main plan: [plan.md](plan.md)

## Steps

- [01 — Shrink Header](frontend/01-shrink-header.md)
- [02 — Shrink GameEdit](frontend/02-shrink-game-edit.md)
- [03 — Shrink GameDocument](frontend/03-shrink-game-document.md)
- [04 — Shrink StlModelNew](frontend/04-shrink-stl-model-new.md)
- [05 — Shrink GameCommonItemEdit](frontend/05-shrink-game-common-item-edit.md)

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`, runs `npm run lint`)
- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)

## Notes
- **What counts as a line**: Lizard's NLOC excludes blank lines and comments but includes the signature and closing brace. Current counts (from Codacy): `Header` 53, `GameEdit` 51, `GameDocument` 53, `StlModelNew` 54, `GameCommonItemEdit` 54. Each must end at 50 or fewer, so the minimum cuts are 3, 1, 3, 4 and 4 lines. Aim for a few lines of margin rather than exactly 50.
- **No behavior change; existing specs stay unmodified.** Each extraction moves code as-is. New hooks/helpers get their own additive specs, mirroring `assets/js/` under `frontend/specs/assets/js/` (for example `specs/assets/js/components/common/header/hooks/useHeaderAuthEffectSpec.js`). Note that `useEffect` callbacks don't run under `renderToStaticMarkup`, so logic worth testing should live in plain functions that hooks merely call, as `useHeaderAuthEffect.js` does.
- **Rules of Hooks**: `GameEdit`, `GameDocument` and `GameCommonItemEdit` return early on `loading`/`error`. Any new hook must be called before those early returns, never after them.
- **Keep existing placement conventions**: page-level hooks go in a sibling `hooks/` folder, static helpers on the existing `*Controller`/`*Helper` classes, and each new file gets a JSDoc block like its neighbours.
- **Verifying the result**: no Lizard runs locally. Count non-blank, non-comment lines of each function by hand, then confirm the Codacy `nloc-medium` findings for these five files clear after the PR's analysis runs.
- The choice of what to extract is a suggestion in each step file. Any equivalent cohesive extraction that clears the limit is acceptable.

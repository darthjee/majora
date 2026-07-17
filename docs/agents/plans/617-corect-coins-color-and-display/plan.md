# Plan: Correct coins color and display

Issue: [617-corect-coins-color-and-display.md](../../issues/617-corect-coins-color-and-display.md)

## Overview
Fix three cosmetic issues in the D&D character-money coin boxes: reorder the rendered elements (icon → count → type), restore the missing border on the Platinum (PP) box, and swap the PP/SP color values so Platinum and Silver are visually correct.

## Context
`CharacterMoneyCoinBox` (`frontend/assets/js/components/resources/character/pages/elements/CharacterMoneyCoinBox.jsx`) renders each denomination as icon → abbreviation (type) → amount (count). Styling for each denomination lives in `frontend/assets/css/main.scss`, where `.coin-box` sets a base `1px solid currentColor` border and each `.coin-box-<denom>` class sets the color. `.coin-box-pp` currently overrides the border with `border: none`, and the color values for `.coin-box-sp` (`#6e7076`) and `.coin-box-pp` (`#45414a`) are swapped relative to what they should be.

## Implementation Steps

### Step 1 — Reorder coin box elements
In `CharacterMoneyCoinBox.jsx`, move the `coin-box-amount` `<span>` (count) so it renders before the `coin-box-abbreviation` `<span>` (type). Final order: icon → count → type.

### Step 2 — Restore the Platinum border
In `main.scss`, remove the `border: none` declaration from `.coin-box-pp` so it falls back to the base `.coin-box` rule (`1px solid currentColor`), matching CP/SP/GP.

### Step 3 — Swap PP/SP colors
In `main.scss`, swap the `color` values between `.coin-box-sp` and `.coin-box-pp`: SP becomes `#45414a` and PP becomes `#6e7076`. No other denomination's color changes.

### Step 4 — Update specs
`CharacterMoneyCoinBoxSpec.js` currently asserts render order and content by substring only (`toContain`), which doesn't lock in ordering. Add/adjust an assertion that checks amount appears before the abbreviation in the rendered HTML (e.g. compare `html.indexOf('coin-box-amount')` vs `html.indexOf('coin-box-abbreviation')`). CSS isn't unit-tested in this repo, so the border/color fixes (Steps 2–3) don't need spec coverage — focus the spec update on the JSX ordering only.

## Files to Change
- `frontend/assets/js/components/resources/character/pages/elements/CharacterMoneyCoinBox.jsx` — reorder count/type spans
- `frontend/assets/css/main.scss` — remove `.coin-box-pp` border override; swap `.coin-box-sp`/`.coin-box-pp` color values
- `frontend/specs/assets/js/components/resources/character/pages/elements/CharacterMoneyCoinBoxSpec.js` — assert new element order

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes
- No electrum (EP) denomination exists in this codebase (`DndMoneyModel` only defines CP/SP/GP/PP), so no additional denomination handling is needed.
- This is a pure frontend change (JSX + SCSS); no backend, proxy, or translation work is involved.

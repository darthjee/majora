# Issue: Correct coins color and display

## Description
In D&D games, character pages show a breakdown of character money as coin boxes (`CharacterMoneyCoinBox`, rendered via `CharacterMoneyCoins`/`CharacterMoneyCoinsHelper`). Each box currently renders, in order: icon, coin type (abbreviation), coin count. Each coin box has a color and a border driven by `.coin-box-<denomination>` classes in `frontend/assets/css/main.scss`, where the border defaults to `1px solid currentColor` inherited from the box color.

## Problems
- The order of elements inside each coin box needs to change from icon → type → count to **icon → count → type**.
- The Platinum (PP) box is missing its border: `.coin-box-pp` in `main.scss` explicitly overrides the base rule with `border: none`.
- The Platinum (PP) and Silver (SP) colors are swapped from what they should be: `.coin-box-sp` currently uses `#6e7076` (grey) and `.coin-box-pp` currently uses `#45414a` (dark slate) — these two color values need to be swapped between the two selectors.

## Expected Behavior
- Every coin box (`CharacterMoneyCoinBox`) renders icon, then count, then type/abbreviation, in that order, for all denominations (CP, SP, GP, PP).
- All four denomination boxes, including PP, show a `1px solid currentColor` border consistent with the base `.coin-box` rule.
- SP box color and PP box color are swapped relative to current values; borders continue to follow `currentColor` for both.

## Solution
- In `frontend/assets/js/components/resources/character/pages/elements/CharacterMoneyCoinBox.jsx`, reorder the three `<span>` elements so `coin-box-amount` (count) renders before `coin-box-abbreviation` (type).
- In `frontend/assets/css/main.scss`, remove the `border: none` override from `.coin-box-pp` so it falls back to the base `.coin-box` border rule.
- In `frontend/assets/css/main.scss`, swap the `color` values between `.coin-box-sp` and `.coin-box-pp` (i.e. SP gets `#45414a` and PP gets `#6e7076`).

## Benefits
- Coin display order matches the more natural reading pattern (icon, amount, denomination).
- All coin boxes have a consistent visual style (icon + colored border) for a currency in D&D games.
- Coin colors correctly distinguish Platinum from Silver, avoiding player confusion when reading character money.

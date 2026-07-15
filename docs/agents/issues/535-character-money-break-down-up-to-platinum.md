# Issue: Character money break down up to platinum

## Description
The character page's money breakdown currently cascades copper, silver, gold, then platinum, and overflows any leftover value above platinum into a separate "PO in gems" (`money.gp_in_gems`) entry. We want platinum to become the top denomination for character money and simply absorb all remaining value, with no gems entry ever shown on the character page.

This only affects the `character` money context in `frontend/assets/js/utils/money/DndMoneyModel.js`. The shared `CoinBreakdown`/`CoinPacker`/`GEMS_MULTIPLIER` gems machinery and the `money.gp_in_gems` translation strings are left in place, since they may still be relevant elsewhere (e.g. treasures) — only the character context's config and the money edit modal's field list change.

## Problem
`DndMoneyModel`'s `character` context config omits an explicit `denominations` list, so `CoinBreakdown`/`CoinPacker` fall back to their own default `['cp', 'sp', 'gp', 'pp']` reference. Both classes treat that exact default specially: platinum cascades the same as the lower denominations (capped below the cascade threshold) and anything above it overflows into a `gems` entry (100 copper-equivalent GP per gem unit). This produces breakdowns like `29 CP, 29 SP, 29 GP, 29 PP, 100 GP in gems` instead of letting platinum absorb the full remaining value. The money edit modal also still shows a `gems` input field for character money (seeded from `DndMoneyModel.denominationKeys('character')`).

## Expected Behavior
For character money, platinum absorbs all remaining value once copper, silver, and gold have cascaded, the same "last denomination absorbs the remainder" behavior already used for restricted denomination sets (e.g. `treasure`). No `gems` entry is ever produced on the character page, and the money edit modal for character money no longer shows a gems input field.

### Example 1 - money = 42219
- Current: `29 CP, 29 SP, 29 GP, 29 PP, 100 GP in gems`
- New: `29 CP, 29 SP, 29 GP, 39 PP`

### Example 2 - money = 33219
- Current: `29 CP, 29 SP, 29 GP, 20 PP, 100 GP in gems`
- New: `29 CP, 29 SP, 29 GP, 30 PP`

## Solution
- In `DndMoneyModel.js`, give the `character` context config an explicit `denominations: ['cp', 'sp', 'gp', 'pp']` array instead of omitting it. Since `CoinBreakdown`/`CoinPacker` only trigger their gems-overflow special case when the denominations array is the exact shared `DEFAULT_DENOMINATION_KEYS` reference, passing an explicit (non-identical) array disables the gems overflow for character money and makes platinum absorb the remainder, without touching `CoinBreakdown.js`, `CoinPacker.js`, or `moneyDenominations.js`.
- Update `DENOMINATION_KEYS_BY_CONTEXT.character` in `DndMoneyModel.js` to drop `'gems'`, leaving `['cp', 'sp', 'gp', 'pp']`, so the money edit modal no longer seeds or renders a gems field for character money.
- Leave `GEMS_MULTIPLIER`, the `gems` key handling in `CoinBreakdown`/`CoinPacker`, `LABEL_KEYS.gems`, and the `money.gp_in_gems` translation strings untouched elsewhere, since they may still be relevant outside the character context.
- Update the stale comment in `DndMoneyModel.js` explaining the previous "intentionally omits denominations" rationale.
- Update affected specs (`DndMoneyModelSpec`, `CharacterMoneyHelperSpec`, `MoneyEditModalControllerSpec`, `MoneyEditModalSpec`, etc.) to reflect the new character breakdown and edit-modal field list.

## Benefits
- Character money breakdowns are simpler and match how players actually expect platinum to behave (no invented "gems" currency), with a minimal, low-risk change confined to the `character` context config.
- Shared coin breakdown/packing utilities and gems support elsewhere in the codebase are left untouched, avoiding any risk to other money contexts.

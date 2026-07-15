# Plan: Character money break down up to platinum

Issue: [535-character-money-break-down-up-to-platinum.md](../../issues/535-character-money-break-down-up-to-platinum.md)

## Overview
Stop the character money breakdown from overflowing leftover value above platinum into a "PO in gems" entry. Platinum becomes the top denomination for the `character` money context and absorbs all remaining value, mirroring the behavior the `treasure` context already has. The fix is scoped entirely to `frontend/assets/js/utils/money/DndMoneyModel.js`'s `character` context configuration — the shared `CoinBreakdown`/`CoinPacker`/`GEMS_MULTIPLIER` gems machinery and the `money.gp_in_gems` translation strings stay untouched, since they may still be relevant outside this context.

## Context
`CoinBreakdown`/`CoinPacker` only trigger their gems-overflow special case when the `denominations` array passed in is the exact `DEFAULT_DENOMINATION_KEYS` reference exported from `moneyDenominations.js`. `DndMoneyModel`'s `character` context config currently omits `denominations` entirely, so it falls back to that default reference and inherits the gems overflow. The `treasure` context already passes its own explicit `['cp', 'sp', 'gp']` array, which is why it already has "last denomination absorbs the remainder" behavior instead of overflowing.

## Implementation Steps

### Step 1 — Disable gems overflow for the character context
In `frontend/assets/js/utils/money/DndMoneyModel.js`, change `CONTEXT_CONFIGS.character` to pass an explicit `denominations: ['cp', 'sp', 'gp', 'pp']` array (a new array literal, not the imported `DEFAULT_DENOMINATION_KEYS` reference) alongside the existing `cascadeThreshold: 30`. Passing a non-identical array makes `CoinBreakdown`/`CoinPacker` treat it as a restricted set, so platinum (the last entry) absorbs all remaining value instead of cascading and overflowing into `gems`.

Update the comment above `CONTEXT_CONFIGS` (currently explaining why `denominations` is intentionally omitted) to reflect the new, opposite rationale: it's now intentionally included as an explicit array specifically to disable the gems overflow.

### Step 2 — Drop gems from the character denomination-key list
In the same file, update `DENOMINATION_KEYS_BY_CONTEXT.character` from `['cp', 'sp', 'gp', 'pp', 'gems']` to `['cp', 'sp', 'gp', 'pp']`. This list feeds `MoneyEditModalController.seedBreakdown`/`canConfirm` (via `denominationKeys`), so the money edit modal for character money stops seeding, rendering, and requiring a `gems` input field.

Leave `LABEL_KEYS.gems` and the `money.gp_in_gems` translation strings (`en.yaml`/`pt.yaml`) as-is — they become unreachable for the character context but are out of scope for this issue per explicit product direction.

### Step 3 — Update specs
Update the specs that assert the old gems-overflow behavior for the `character` context to expect platinum absorbing the remainder instead, and update specs asserting the edit modal's character field list to no longer include `gems`:
- `frontend/specs/assets/js/utils/money/DndMoneyModelSpec.js` — the `.transform` "overflows into gems once platinum absorbs its cascade threshold" case (currently `32221` → `cp:21, sp:20, gp:20, pp:20, gems:100`) must become a single combined `pp` entry absorbing the remainder (`pp:120`, no `gems` entry). The `.pack` "sums copper, silver, gold, platinum and gems weighted by their relative value" case must drop the `gems` term from both the input breakdown and the expected total (a `gems` field in the input, if still passed, is simply ignored since the character context no longer adds a gems term).
- `frontend/specs/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyHelperSpec.js` — any case rendering a gems entry/label needs to be updated or removed to match the new breakdown.
- `frontend/specs/assets/js/components/common/controllers/MoneyEditModalControllerSpec.js` and `frontend/specs/assets/js/components/common/helpers/MoneyEditModalHelperSpec.js` — any assertion on the character context's field list or seeded `gems` key must drop it.
- `frontend/specs/assets/js/components/common/MoneyEditModalSpec.js` — any rendering assertion expecting a gems input for `context="character"` must be updated to expect only CP/SP/GP/PP fields.

Use example money totals from the issue (`42219` → `29 CP | 29 SP | 29 GP | 39 PP`, `33219` → `29 CP | 29 SP | 29 GP | 30 PP`) as additional/replacement coverage where useful.

## Files to Change
- `frontend/assets/js/utils/money/DndMoneyModel.js` — explicit `denominations` array for the `character` context config; drop `gems` from `DENOMINATION_KEYS_BY_CONTEXT.character`; update stale comment.
- `frontend/specs/assets/js/utils/money/DndMoneyModelSpec.js` — update `.transform`/`.pack` character-context expectations to drop gems overflow.
- `frontend/specs/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyHelperSpec.js` — update any gems-rendering case.
- `frontend/specs/assets/js/components/common/controllers/MoneyEditModalControllerSpec.js` — update character field-list expectations.
- `frontend/specs/assets/js/components/common/helpers/MoneyEditModalHelperSpec.js` — update character field-list expectations if it asserts on rendered fields.
- `frontend/specs/assets/js/components/common/MoneyEditModalSpec.js` — update character-context rendering expectations to exclude the gems input.

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes
- No backend or translation changes are needed — `gems` is not referenced anywhere in `backend/`, and the `money.gp_in_gems` translation key is intentionally left in place per the issue's explicit scope (only the edit modal field is removed; other gems-related code/translations stay untouched in case they're needed elsewhere, e.g. treasures).
- The `treasure` context is unaffected — it already passes an explicit `denominations` array and never triggers gems overflow.

# Plan: Fix style of moneys and treasure values for deadlands

Issue: [666-fix-style-of-moneys-and-treasure-values-for-deadlands.md](../../issues/666-fix-style-of-moneys-and-treasure-values-for-deadlands.md)

## Overview

Update the Deadlands-only character money/treasure boxes (icon + color) on the PC/NPC show page, and switch every shared treasure-value text display (tooltip, treasures list, treasure show page, new/edit forms, exchange/add-treasure modals) from the current sentence-style breakdown (e.g. "20 Dollars") to the new `$ <dollars>,<cents>` numeric format — but only for `game_type === 'deadlands'`. `dnd` treasures keep their current sentence format untouched.

This is a single-agent, frontend-only change. All work lives under `frontend/`.

## Context

- `TreasureMoney`/`TreasureMoneyHelper` is the single shared component behind nearly every treasure-value text spot in the app (already confirmed via codebase search: `TreasureExchangeModalHelper.jsx`, `AddGameTreasureModalHelper.jsx`, `TreasureValueField.jsx`, `TreasureHelper.jsx`, `TreasureCardHelper.jsx`, `TreasurePreviewCardHelper.jsx`, and `TreasureListItem.js` all call into it, and all already pass a `gameType`/`game_type` prop). Branching this one helper on `gameType === 'deadlands'` covers all of those call sites without touching each page.
- `CharacterMoneyBillHelper.jsx` and `CharacterMoneyTreasureBillHelper.jsx` (under `frontend/assets/js/components/resources/character/pages/elements/helpers/`) already render the deadlands-only two-box money component in `$ dollars,cents` format — these only need the icon and color tweaks from the issue, not a format change.
- Currency math already lives in `DeadlandsMoneyModel` (`frontend/assets/js/utils/money/DeadlandsMoneyModel.js`), via `transformDense(value)` → `{ cents, dollars }`. Both `CharacterMoneyBillHelper` and the target `TreasureMoneyHelper` deadlands branch need the same "zero-pad cents, split dollars/cents" logic — worth extracting into one shared helper to avoid a third copy-paste of the same 3 lines.
- Confirmed via user clarification during discussion:
  - Icon: bootstrap-icons has no `coin-cash`; use `bi-cash-coin` instead.
  - Treasure box: keep the existing gold background (`.character-money-bill-treasure`); only the text/icon color changes, from `#ffffff` to `#2e2e2e`.
  - The `$` prefix is always included, even for `100,00`/`0,00` (the issue's own examples were inconsistent on this).
  - The new numeric format applies only to `deadlands` treasures; `dnd` keeps the current sentence format.

## Implementation Steps

### Step 1 — Add a shared dollars/cents formatter

Extract the "split cents into `{dollars, cents}`, zero-pad cents to 2 digits" logic (currently duplicated in `CharacterMoneyBillHelper.render` and `CharacterMoneyTreasureBillHelper.render`) into a small shared static helper — e.g. a `formatDense(value)` static method added to `DeadlandsMoneyModel` (natural home, since it already owns `transformDense`) returning `{ dollars, cents: paddedCents }` or the fully formatted `"dollars,cents"` string. Update `CharacterMoneyBillHelper` and `CharacterMoneyTreasureBillHelper` to use it, and reuse it in Step 2 below for `TreasureMoneyHelper`'s new deadlands branch.

### Step 2 — Branch `TreasureMoneyHelper.render` on game type

In `frontend/assets/js/components/common/helpers/TreasureMoneyHelper.jsx`, add a `gameType === 'deadlands'` branch that renders `$ <dollars>,<cents>` (via the Step 1 helper) instead of the sentence-style breakdown, without changing the `dnd` path or the underlying `DeadlandsMoneyModel.transform`/`transformDense` breakdown logic. Since `TreasureMoney.jsx` and `TreasureListItem.js` both delegate to this one method, this single change propagates to:
- The treasures list mouse-over tooltip (`TreasurePreviewCardHelper.jsx`)
- PC/NPC treasures page treasure value text (`TreasureListItem.js`, `TreasureCardHelper.jsx`)
- Exchange modal treasure value and character money text (`TreasureExchangeModalHelper.jsx`)
- Add-treasure modal (`AddGameTreasureModalHelper.jsx`)
- Game treasures page, new/edit forms (`TreasureValueField.jsx`)
- Global treasures list page and treasure show page (`TreasureHelper.jsx`, `TreasureCardHelper.jsx`)

Update the JSDoc on `TreasureMoneyHelper.render` and `TreasureMoney.jsx` to document the new deadlands-specific format.

### Step 3 — Character money box icon

In `frontend/assets/js/utils/ui/Icons.js`, add a `cashCoin: 'bi-cash-coin'` entry. In `CharacterMoneyBillHelper.jsx`, replace the custom `<span className="coin-icon" aria-hidden="true"></span>` with `<i className={`bi ${Icons.cashCoin}`} aria-hidden="true"></i>`, matching the pattern already used for the gem icon in `CharacterMoneyTreasureBillHelper.jsx`.

In `frontend/assets/css/main.scss`, update the selector that currently sizes the icon (`.character-money-bill .coin-icon { font-size: 1.1rem; }`, around line 218) to target `.character-money-bill .bi-cash-coin` instead. Leave the `.coin-icon::before` mask-based rule and `coins.svg` asset in place only if still referenced elsewhere in the codebase — remove them if this was their only use (verify with a repo-wide grep for `coin-icon` before deleting).

### Step 4 — Treasure box color

In `frontend/assets/css/main.scss`, change `.character-money-bill-treasure`'s `color: #ffffff;` to `color: #2e2e2e;` (around line 240), keeping `background-color: gold;` and `border-color: #b8860b;` unchanged.

### Step 5 — Update specs

Update/add Jasmine specs for every file touched:
- `specs/assets/js/components/common/helpers/TreasureMoneyHelperSpec.js` and `specs/assets/js/components/common/TreasureMoneySpec.js` — cover the new deadlands numeric-format branch (including zero value, e.g. `$ 0,00`) alongside the existing dnd sentence-format cases.
- `specs/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyBillHelperSpec.js` and `CharacterMoneyTreasureBillHelperSpec.js` (plus their `CharacterMoneyBillSpec.js`/`CharacterMoneyTreasureBillSpec.js` counterparts) — update icon assertions (`bi-cash-coin` instead of `coin-icon`) and, if the shared formatter from Step 1 changes any output shape, adjust accordingly.
- Any spec asserting the old `.coin-icon` class or the treasure box's white text color, if such assertions exist — grep for `coin-icon` and `#ffffff`/`character-money-bill-treasure` in `specs/` before finalizing.

## Files to Change

- `frontend/assets/js/utils/money/DeadlandsMoneyModel.js` — add shared dense dollars/cents formatting helper.
- `frontend/assets/js/components/common/helpers/TreasureMoneyHelper.jsx` — branch on `gameType === 'deadlands'` for the new numeric format.
- `frontend/assets/js/components/common/TreasureMoney.jsx` — update JSDoc only (behavior inherited from the helper).
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyBillHelper.jsx` — swap icon to `bi-cash-coin`, reuse shared formatter.
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyTreasureBillHelper.jsx` — reuse shared formatter (no icon/format change, only Step 4's CSS color affects this box).
- `frontend/assets/js/utils/ui/Icons.js` — add `cashCoin: 'bi-cash-coin'`.
- `frontend/assets/css/main.scss` — retarget icon-sizing selector to `.bi-cash-coin`; change `.character-money-bill-treasure` text color to `#2e2e2e`; remove `.coin-icon` rule/`coins.svg` reference if unused elsewhere.
- Specs listed in Step 5.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`, via `npm run lint`)
- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)

## Notes

- Verify no other component still renders `<span className="coin-icon">` before deleting the `.coin-icon`/`coins.svg` CSS — if something else depends on it, leave it in place and only add the new `bi-cash-coin` sizing rule.
- The issue's phrase "without changing the breakdown" is honored: only the final text formatting changes in `TreasureMoneyHelper`; the underlying `DeadlandsMoneyModel.transform`/`transformDense` math is untouched.
- `AddGameTreasureModalHelper.jsx` wasn't explicitly named in the issue's location list but shares the `TreasureMoney` component, so it gets the new format for free — flagged here so it isn't missed during review.

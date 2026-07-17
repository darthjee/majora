# Plan: Show deadland money in dollars

Issue: [618-show-deadland-money-in-dollars.md](../../issues/618-show-deadland-money-in-dollars.md)

## Overview

Give Deadlands character/NPC pages a dedicated money display, parallel to the
D&D coin-box stack, instead of falling back to the generic cents/dollars
breakdown text. The new display is a dark-green, dollar-bill-styled box
showing the coins icon, a `$` sign, and the dollar/cent composition separated
by a comma, with cents zero-padded to two digits (e.g. `$ 100,02`). It always
renders, even at 0 (`$ 0,00`). This is purely a frontend, display-only change
— no backend, API, or breakdown-logic changes.

## Context

- `CharacterMoneyHelper.render(money, gameType)` (frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyHelper.jsx)
  already special-cases `gameType === 'dnd'` to render `<CharacterMoneyCoins />`,
  a dense (always-four, zero-inclusive) coin-box stack built via
  `DndMoneyModel.transformDense`. Every other `gameType` (including
  `deadlands`) falls through to a generic cascading breakdown line built from
  `MoneyModelRegistry.resolve(gameType).transform(...)`, which returns `null`
  (renders nothing) when there are no non-zero entries.
- `DeadlandsMoneyModel` (frontend/assets/js/utils/money/DeadlandsMoneyModel.js)
  currently only exposes `transform`, which filters out zero-quantity
  entries — there is no dense/zero-inclusive variant yet, unlike
  `DndMoneyModel.transformDense`.
- The D&D coin box pattern to mirror: `CharacterMoneyCoins.jsx` (top
  component) delegates to `CharacterMoneyCoinsHelper.jsx` (rendering logic),
  which renders a `.character-money-coins` wrapper of `CharacterMoneyCoinBox`
  elements. Coin box CSS lives in `frontend/assets/css/main.scss` (`.coin-box`,
  `.coin-icon`, per-denomination color classes), and the coins icon is
  applied via the `.coin-icon::before` mask-image rule referencing
  `../images/icons/coins.svg` — reuse this same class rather than duplicating
  the icon technique.
- Money is stored as raw cents for `deadlands` (see `DeadlandsMoneyModel`):
  `dollars = Math.floor(value / 100)`, `cents = value % 100`.

## Implementation Steps

### Step 1 — Add a dense transform to `DeadlandsMoneyModel`

Add `DeadlandsMoneyModel.transformDense(value = 0, _options = {})`, mirroring
`DndMoneyModel.transformDense`'s naming/shape but always returning both the
`cents` and `dollars` entries (no zero-filtering), e.g.:

```js
static transformDense(value = 0, _options = {}) {
  const dollars = Math.floor(value / 100);
  const cents = value % 100;

  return [
    { key: 'cents', quantity: cents },
    { key: 'dollars', quantity: dollars },
  ];
}
```

### Step 2 — Create the dedicated Deadlands money display component

Add `CharacterMoneyBill.jsx` (top component) and
`CharacterMoneyBillHelper.jsx` (rendering helper) under
`frontend/assets/js/components/resources/character/pages/elements/` and its
`helpers/` subfolder, mirroring the `CharacterMoneyCoins`/
`CharacterMoneyCoinsHelper` pair used for `dnd`.

`CharacterMoneyBillHelper.render(money)`:
- Calls `DeadlandsMoneyModel.transformDense(money)` to get `cents`/`dollars`
  quantities.
- Formats cents as two digits with a leading zero (`String(cents).padStart(2, '0')`).
- Renders a box (e.g. `<div className="character-money-bill">`) containing,
  in order: the coins icon (reuse the existing `coin-icon` class), a literal
  `$`, and `${dollars},${paddedCents}`.

### Step 3 — Wire it into `CharacterMoneyHelper`

In `CharacterMoneyHelper.render`, add a `gameType === 'deadlands'` branch
(alongside the existing `dnd` branch) that returns
`<CharacterMoneyBill money={money} />`, before falling through to the
generic breakdown for any other/unknown game type. This removes the
zero-returns-null behavior for `deadlands` specifically — the bill box
always renders, even at `money === 0`.

### Step 4 — Style the box

Add `.character-money-bill` (and any child element classes needed) to
`frontend/assets/css/main.scss`, near the existing `.coin-box` rules: a
dark-green background/border, simple rectangular box, sized/padded similarly
to `.coin-box`. Reuse `.coin-icon` for the icon rather than adding a new
mask-image rule.

### Step 5 — Update/add tests

- `frontend/specs/assets/js/utils/money/DeadlandsMoneyModelSpec.js`: add
  coverage for `transformDense`, including the `value = 0` case (both
  entries present with `quantity: 0`).
- Add `CharacterMoneyBillSpec.js` and `CharacterMoneyBillHelperSpec.js`
  (mirroring `CharacterMoneyCoinsSpec.js` /
  `CharacterMoneyCoinsHelperSpec.js`), covering the formatting examples from
  the issue (`10002` → `100,02`, `10000` → `100,00`, `10010` → `100,10`) and
  the always-renders-at-0 case.
- `frontend/specs/.../helpers/CharacterMoneyHelperSpec.js`: update the two
  existing `deadlands` tests — `'renders a deadlands cents/dollars
  breakdown'` and `'returns null for deadlands when money is 0'` — since
  `deadlands` no longer uses the generic breakdown/null-at-zero path; replace
  them with assertions that `gameType: 'deadlands'` now renders the bill box
  (including at `money: 0`).

## Files to Change

- `frontend/assets/js/utils/money/DeadlandsMoneyModel.js` — add `transformDense`.
- `frontend/assets/js/components/resources/character/pages/elements/CharacterMoneyBill.jsx` — new top component.
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyBillHelper.jsx` — new rendering helper.
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyHelper.jsx` — add `deadlands` branch.
- `frontend/assets/css/main.scss` — add `.character-money-bill` styles.
- `frontend/specs/assets/js/utils/money/DeadlandsMoneyModelSpec.js` — cover `transformDense`.
- `frontend/specs/assets/js/components/resources/character/pages/elements/CharacterMoneyBillSpec.js` — new.
- `frontend/specs/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyBillHelperSpec.js` — new.
- `frontend/specs/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyHelperSpec.js` — update `deadlands` cases.

## CI Checks

- `frontend`: `npm test` (CI job: `jasmine`)
- `frontend`: `npm run coverage` (CI job: `coverage-final` / Codacy upload)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- Purely a display change: no backend/API changes, no changes to treasure
  pages, treasure acquisition, or the money edit modal's breakdown/packing
  logic.
- No specific dark-green hex or bill decoration was mandated by the issue —
  pick a reasonable dark green and a simple bordered rectangle consistent
  with the existing `.coin-box` styling.
- No new i18n keys are needed: the display uses a literal `$` and comma
  separator, not the existing `money.cents_abbreviation`/
  `money.dollars_abbreviation` translation keys.

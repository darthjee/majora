# Frontend Plan: Add value "in treasure"

Main plan: [plan.md](plan.md)

## Shared contracts

Relies on a new i18n key added by the `translator` agent:

- `money.in_gems` — English `in Gems`, Portuguese `em Gemas`.
  Rendered once, as a trailing suffix, on both the D&D treasure line and the Deadlands treasure
  box (not per denomination entry).

No backend work is required — `character.treasure_value` is already present on the API response
consumed by both the show and edit pages, expressed in the same lowest denomination as
`character.money` (copper pieces for `dnd`, cents for `deadlands`).

## Implementation Steps

### Step 1 — Thread `treasure_value` into `CharacterMoney`

- `frontend/assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx` (show
  page, ~line 83): pass a new `treasureValue={character.treasure_value}` prop to
  `<CharacterMoney>`, alongside the existing `money`/`gameType`/`canEditMoney`/`onEditMoney`.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterEdit.jsx` (edit page):
  add `treasureValue: character?.treasure_value ?? 0` to the state object passed as the first
  argument to `EditHelper.render(...)`. It is read-only, so it does **not** need its own
  `useState`/setter/effect wiring like `money` does — just pass the value straight from the
  loaded `character`.
- `frontend/assets/js/components/resources/character/pages/helpers/BaseCharacterEditHelper.jsx`
  (~line 81): forward `treasureValue={state.treasureValue}` into `<CharacterMoneyField>`.

### Step 2 — Extend `CharacterMoney` / `CharacterMoneyField` and their helpers

- `CharacterMoney.jsx` / `CharacterMoneyHelper.jsx`: accept the new `treasureValue` prop
  (default `0`) and forward it into the per-game-type renderer (`CharacterMoneyCoins` for `dnd`,
  `CharacterMoneyBill` for `deadlands`). Renders nothing extra for the generic/other game-type
  cascading-line branch — this issue only specifies `dnd` and `deadlands` behavior.
- `CharacterMoneyField.jsx` / `CharacterMoneyFieldHelper.jsx`: accept and forward `treasureValue`
  the same way, down into `CharacterMoney`.

### Step 3 — D&D treasure coin box

- Add a new component, e.g. `CharacterMoneyTreasureBox.jsx` (+ helper), rendered by
  `CharacterMoneyCoinsHelper`/`CharacterMoneyCoins` after the existing CP/SP/GP/PP stack, inside
  (or alongside) `.character-money-coins`. Render nothing when `treasureValue` is `0`.
- Breakdown: `DndMoneyModel.transform(treasureValue, { context: 'treasure' })` — this already
  implements the cascading CP→SP→GP logic with a max of 10 per denomination (GP absorbing the
  remainder), filtering out zero-quantity entries, exactly matching the issue's examples:
  - `2000` → `[{ key: 'gp', quantity: 20 }]`
  - `2020` → `[{ key: 'sp', quantity: 2 }, { key: 'gp', quantity: 20 }]`
- Format each entry as `"<quantity> <ABBREVIATION>"` using the existing
  `money.cp_abbreviation`/`sp_abbreviation`/`gp_abbreviation` keys (same abbreviations as the
  regular coin boxes — do **not** reuse the existing `money.gp_in_gems` key, which is an
  unrelated overflow label for the generic cascading money breakdown), join entries with `" | "`,
  then append the translated `money.in_gems` label once at the end of the whole line.
  - `2000` → `20 GP in Gems`
  - `2020` → `2 SP | 20 GP in Gems`
- Style: reuse the `.coin-box` base class (border, padding, icon) with a new bright-red modifier
  class, e.g. `.coin-box-treasure { color: red; }`, added in `frontend/assets/css/main.scss`
  next to the existing `.coin-box-cp`/`.coin-box-sp`/`.coin-box-gp`/`.coin-box-pp` rules
  (~line 196-210). Unlike the fixed-abbreviation coin boxes, this box's text content is the full
  multi-part breakdown string, not a single "amount + abbreviation" pair — do not force it
  through `CharacterMoneyCoinBox.jsx` unchanged; adapt or add a sibling.

### Step 4 — Deadlands treasure box

- Add a new component, e.g. `CharacterMoneyTreasureBill.jsx` (+ helper), rendered right after
  `CharacterMoneyBill` (below the current money box), only when `treasureValue` is not `0`.
- Amount: same cents/dollars split as `CharacterMoneyBillHelper` — reuse
  `DeadlandsMoneyModel.transformDense(treasureValue)`, format as `$ <dollars>,<paddedCents>`
  (same padding as the existing money bill: `String(cents).padStart(2, '0')`).
- Append the translated `money.in_gems` label after the amount.
- Style: new CSS class, e.g. `.character-money-bill-treasure`, sibling of `.character-money-bill`
  (~line 212-224 in `main.scss`) — same box shape, but `background-color` gold instead of dark
  green (`#14532d`), with white text (the existing `color: #f0fff4` already reads as
  near-white and can be reused or tightened to pure white).

### Step 5 — Tests

Add/update Jasmine specs mirroring `frontend/specs/...`'s existing structure for every touched
component/helper:

- `CharacterMoney`/`CharacterMoneyHelper` — new `treasureValue` prop forwarding.
- New treasure box components/helpers (D&D and Deadlands) — cover:
  - `treasureValue: 0` → renders nothing.
  - `treasureValue: 2000` → `20 GP in Gems` (D&D).
  - `treasureValue: 2020` → `2 SP | 20 GP in Gems` (D&D).
  - A representative Deadlands cents/dollars value → `$ <dollars>,<cents> in Gems`.
- `CharacterHelper` (show page) and `BaseCharacterEditHelper`/`CharacterEdit` (edit page) — prop
  threading from `character.treasure_value` down to `CharacterMoney`.

## Files to Change

- `frontend/assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx`
- `frontend/assets/js/components/resources/character/pages/shared/CharacterEdit.jsx`
- `frontend/assets/js/components/resources/character/pages/helpers/BaseCharacterEditHelper.jsx`
- `frontend/assets/js/components/resources/character/pages/elements/CharacterMoney.jsx`
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyHelper.jsx`
- `frontend/assets/js/components/resources/character/pages/elements/CharacterMoneyField.jsx`
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyFieldHelper.jsx`
- `frontend/assets/js/components/resources/character/pages/elements/CharacterMoneyCoins.jsx`
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyCoinsHelper.jsx`
- `frontend/assets/js/components/resources/character/pages/elements/CharacterMoneyBill.jsx`
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyBillHelper.jsx`
- New: `CharacterMoneyTreasureBox.jsx` (+ helper) — D&D treasure coin box
- New: `CharacterMoneyTreasureBill.jsx` (+ helper) — Deadlands treasure box
- `frontend/assets/css/main.scss` — new `.coin-box-treasure` and `.character-money-bill-treasure`
  rules
- Corresponding new/updated files under `frontend/specs/...` for all of the above

## CI Checks

- `frontend`: `npm test` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- Do not reuse the existing `money.gp_in_gems` i18n key — it is a pre-existing, unrelated label
  for GP-overflow "gems" entries in the *generic* (non-dnd/deadlands) cascading money breakdown
  used elsewhere (`DndMoneyModel`'s default `character`-context overflow handling). This issue's
  suffix is a new, separate key (`money.in_gems`, see [plan.md](plan.md)'s "Shared contracts").
- `treasure_value` is read-only in this issue; do not wire an edit modal/button for it.

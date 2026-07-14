# Frontend Plan: Add money editor modal

Main plan: [plan.md](plan.md)

## Shared contracts

- Consume (do not create) the new `money_edit_modal.title` / `.confirm` / `.cancel` i18n
  keys and the new `pc_edit_page.edit_money_button` / `npc_edit_page.edit_money_button`
  keys — these are added by the `translator` agent in `frontend/assets/i18n/en.yaml` and
  `pt.yaml`.
- Reuse the already-existing, already-translated `money.copper_piece`,
  `money.silver_piece`, `money.gold_piece`, `money.platinum_piece`, `money.gp_in_gems`
  keys for the modal's row labels — no new keys needed for these.

## Context

- The existing "Edit links" modal (`LinksEditModal.jsx` / `LinksEditModalController.js`
  / `LinksEditModalHelper.jsx`, under
  `frontend/assets/js/components/resources/character/pages/elements/`) is the pattern to
  replicate: a component holding local state seeded from the parent's current value via
  `useEffect` on `show`, a pure static controller class for local data transforms, a pure
  static helper class for the JSX, and wiring in `CharacterEdit.jsx`
  (`frontend/assets/js/components/resources/character/pages/shared/CharacterEdit.jsx`)
  via a `show*Modal` boolean state, `onClose` discarding local edits, and `onConfirm`
  writing the finished value back into parent state and closing the modal.
- Money is currently a single raw `FormField` (type `number`) in
  `BaseCharacterEditHelper.jsx` (`frontend/assets/js/components/resources/character/pages/helpers/BaseCharacterEditHelper.jsx:79-86`),
  bound to `CharacterEdit.jsx`'s `money` state (a **string**, e.g. `'310'` — seeded via
  `String(character.money ?? 0)` and parsed back with `parseInt(formValues.money, 10)` in
  `BaseCharacterEditController.submitForm`). **None of that string-based
  load/submit plumbing changes** — the modal only needs to produce a new total and hand
  it to `setMoney(String(newTotal))`, exactly like `LinksEditModal`'s `onConfirm` hands a
  finished array to `setLinks`.
- The show page displays money via `CharacterMoney` (`.../elements/CharacterMoney.jsx`),
  which calls `CharacterMoneyHelper.render(money)`
  (`.../elements/helpers/CharacterMoneyHelper.jsx`), which resolves the `dnd` money model
  from `MoneyModelRegistry` and calls `model.transform(money, { context: 'character' })`.
  That model is `DndMoneyModel`
  (`frontend/assets/js/utils/money/DndMoneyModel.js`), a thin per-context facade over
  `CoinBreakdown` (`frontend/assets/js/utils/money/CoinBreakdown.js`), which only
  **unpacks** a copper total into denomination entries (`build(money)` →
  `{key, quantity}[]`, filtering out zero entries). There is no packing (inverse)
  direction anywhere today.
- `TreasureMoney` / `TreasureMoneyHelper`
  (`frontend/assets/js/components/common/TreasureMoney.jsx` /
  `.../common/helpers/TreasureMoneyHelper.jsx`) already go through the exact same
  `MoneyModelRegistry` → `DndMoneyModel` → `CoinBreakdown` path, just with
  `context: 'treasure'` (denominations `['cp','sp','gp']`, threshold 10, no gems). They
  do **not** call `CoinBreakdown` directly today, so once packing is added to
  `DndMoneyModel` alongside unpacking, both contexts are already served by the same
  common-interface class — **no code change is required in `TreasureMoney*` or
  `CharacterMoney*` for this**, they already satisfy "use the common interface for both
  packing and unpacking" by construction. Only confirm this during implementation; don't
  spend effort trying to "migrate" them off something they don't call.
- Packing formula (confirmed with the issue author): the "30" cascade threshold in
  `CoinBreakdown` only controls how a total is *displayed* (max coins of a given type
  before it rolls into the next denomination) — it is unrelated to packing. Packing is a
  plain weighted sum using the relative value of each denomination:
  `total = cp×1 + sp×10 + gp×100 + pp×1000 + gems×100` (the `gems` field is already
  denominated in "GP-equivalent" units per the existing `gp_in_gems` label and the
  existing `GEMS_MULTIPLIER = 100` constant in `CoinBreakdown.js` — reuse that same
  constant/value for packing so the two stay in sync).
- Money-field validation: the modal's Save/Confirm button must be disabled while any
  denomination input is negative or non-integer (mirrors `LinksEditModalController.canConfirm`
  gating `LinksEditModalHelper`'s Confirm button).

## Implementation Steps

### Step 1 — Add the packing class

Create `frontend/assets/js/utils/money/CoinPacker.js`, mirroring `CoinBreakdown`'s
constructor shape (`{ denominations = ['cp','sp','gp','pp'] }`) but implementing the
inverse operation:

- `pack(breakdown = {})` → sums `breakdown[key] * 10 ** index` for each denomination key
  in order (cp=10^0, sp=10^1, gp=10^2, pp=10^3), then, only for the default denomination
  set, adds `breakdown.gems * GEMS_MULTIPLIER`.
- Treat missing/non-numeric fields as `0` (`Number(breakdown[key]) || 0`).

Consider extracting the shared `DEFAULT_DENOMINATION_KEYS` / `GEMS_MULTIPLIER` constants
out of `CoinBreakdown.js` into a small shared constants module imported by both
`CoinBreakdown.js` and `CoinPacker.js`, so the two classes can never drift apart on the
gems conversion rate — this is a judgment call, not a hard requirement.

Add `frontend/specs/assets/js/utils/money/CoinPackerSpec.js`, mirroring
`frontend/specs/assets/js/utils/money/CoinBreakdownSpec.js`'s structure. Cover: default
denominations with and without gems, custom (treasure-style) denominations with no gems
term, and that `pack(unpack(money))` round-trips to the same total for representative
values (this is the actual invariant that matters, not matching `CoinBreakdown`'s
cascade quirk digit-for-digit).

### Step 2 — Expose packing through the common interface

Extend `DndMoneyModel.js` with a `static pack(breakdown, { context })` method that
resolves the same `CONTEXT_CONFIGS` entry `transform` already uses and delegates to
`new CoinPacker(config).pack(breakdown)`. Update
`frontend/specs/assets/js/utils/money/DndMoneyModelSpec.js` to cover the new method for
both the `character` and `treasure` contexts.

### Step 3 — Money edit modal controller (pure logic)

Create
`frontend/assets/js/components/resources/character/pages/elements/controllers/MoneyEditModalController.js`,
a pure static class parallel to `LinksEditModalController`:

- `seedBreakdown(money)` — resolves `MoneyModelRegistry.resolve('dnd').transform(Number(money) || 0, { context: 'character' })`
  and normalizes the sparse `{key, quantity}[]` result into a dense
  `{ cp: 0, sp: 0, gp: 0, pp: 0, gems: 0, ...values-present-in-entries }` object (the
  modal's per-row inputs need a value even for denominations `CoinBreakdown` omitted
  because they were zero).
- `updateField(breakdown, key, value)` — merge, same shape as
  `LinksEditModalController.updateLink`.
- `canConfirm(breakdown)` — true only when every field is a non-negative integer
  (`Number.isInteger(value) && value >= 0` for each of cp/sp/gp/pp/gems).
- `computeTotal(breakdown)` — `MoneyModelRegistry.resolve('dnd').pack(breakdown, { context: 'character' })`.

Add
`frontend/specs/assets/js/components/resources/character/pages/elements/controllers/MoneyEditModalControllerSpec.js`
mirroring `LinksEditModalControllerSpec.js`'s structure.

### Step 4 — Money edit modal rendering helper

Create
`frontend/assets/js/components/resources/character/pages/elements/helpers/MoneyEditModalHelper.jsx`,
parallel to `LinksEditModalHelper.jsx`: a `Modal` with one `FormField` (type `number`)
row per denomination — labels `Translator.t('money.copper_piece')`,
`money.silver_piece`, `money.gold_piece`, `money.platinum_piece`, `money.gp_in_gems` (for
the gems row) — and a footer with Cancel/Confirm buttons using
`Translator.t('money_edit_modal.cancel')` / `.confirm`, Confirm disabled while
`!state.canConfirm`. Title via `Translator.t('money_edit_modal.title')`.

Add
`frontend/specs/assets/js/components/resources/character/pages/elements/helpers/MoneyEditModalHelperSpec.js`
mirroring `LinksEditModalHelperSpec.js`.

### Step 5 — Money edit modal component

Create
`frontend/assets/js/components/resources/character/pages/elements/MoneyEditModal.jsx`,
parallel to `LinksEditModal.jsx`: props `show`, `money` (current raw copper total),
`onClose`, `onConfirm(newTotal)`. Holds local `breakdown` state seeded via
`MoneyEditModalController.seedBreakdown(money)`, re-seeded in a `useEffect` keyed on
`[show, money]`. `handleConfirm` calls
`onConfirm(MoneyEditModalController.computeTotal(breakdown))`. Delegates rendering to
`MoneyEditModalHelper.render(...)`.

Add
`frontend/specs/assets/js/components/resources/character/pages/elements/MoneyEditModalSpec.js`
mirroring `LinksEditModalSpec.js`.

### Step 6 — Wire the modal into the edit page

In `CharacterEdit.jsx`:
- Add `const [showMoneyModal, setShowMoneyModal] = useState(false);` next to
  `showLinksModal`.
- Add `onOpenMoneyModal: () => setShowMoneyModal(true)` to the handlers object passed to
  `EditHelper.render` (next to `onOpenLinksModal`).
- Render `<MoneyEditModal show={showMoneyModal} money={money} onClose={() => setShowMoneyModal(false)} onConfirm={(newTotal) => { setMoney(String(newTotal)); setShowMoneyModal(false); }} />`
  next to the existing `<LinksEditModal>` render.

Update `frontend/specs/assets/js/components/resources/character/pages/shared/CharacterEditSpec.js`
(and `CharacterEditLinksSpec.js` if it shares relevant setup) to cover opening the money
modal and confirming a new total updates `money` state.

### Step 7 — Replace the raw money input in the edit form

In `BaseCharacterEditHelper.jsx`, replace the `FormField` block at lines 79-86 with a
display + button block, following the same visual pattern as the links section directly
above it (`LinkList` + "Edit links" button, lines 71-78):

```jsx
<div className="mb-3">
  <label className="form-label">{Translator.t(`${i18nNamespace}.money_label`)}</label>
  <CharacterMoney money={Number(state.money) || 0} />
  <button
    type="button"
    className="btn btn-outline-secondary btn-sm"
    onClick={handlers.onOpenMoneyModal}
  >
    {Translator.t(`${i18nNamespace}.edit_money_button`)}
  </button>
  <FieldErrors errors={state.fieldErrors.money ?? []} />
</div>
```

Import `CharacterMoney` from `../elements/CharacterMoney.jsx` and `FieldErrors` from
`../../../../common/FieldErrors.jsx` (same relative depth as the existing `ErrorAlert`
import). Update the class-level JSDoc `@param` for `handlers` to add
`onOpenMoneyModal: Function`.

Note: `CharacterMoney` renders `null` when money is `0` (same as `LinkList` rendering
nothing for an empty list) — this is consistent with existing conventions, the "Edit
money" button is always present regardless.

Update `frontend/specs/assets/js/components/resources/character/pages/helpers/BaseCharacterEditHelper/`
specs (see existing suite under that directory) to cover the new money display + button
markup in place of the removed `FormField`.

## Files to Change

- `frontend/assets/js/utils/money/CoinPacker.js` — new packing class (Step 1)
- `frontend/specs/assets/js/utils/money/CoinPackerSpec.js` — new spec (Step 1)
- `frontend/assets/js/utils/money/DndMoneyModel.js` — add `pack` (Step 2)
- `frontend/specs/assets/js/utils/money/DndMoneyModelSpec.js` — cover `pack` (Step 2)
- `frontend/assets/js/components/resources/character/pages/elements/controllers/MoneyEditModalController.js` — new (Step 3)
- `frontend/specs/.../elements/controllers/MoneyEditModalControllerSpec.js` — new (Step 3)
- `frontend/assets/js/components/resources/character/pages/elements/helpers/MoneyEditModalHelper.jsx` — new (Step 4)
- `frontend/specs/.../elements/helpers/MoneyEditModalHelperSpec.js` — new (Step 4)
- `frontend/assets/js/components/resources/character/pages/elements/MoneyEditModal.jsx` — new (Step 5)
- `frontend/specs/.../elements/MoneyEditModalSpec.js` — new (Step 5)
- `frontend/assets/js/components/resources/character/pages/shared/CharacterEdit.jsx` — wire modal (Step 6)
- `frontend/specs/.../shared/CharacterEditSpec.js` — cover wiring (Step 6)
- `frontend/assets/js/components/resources/character/pages/helpers/BaseCharacterEditHelper.jsx` — replace money input (Step 7)
- `frontend/specs/.../helpers/BaseCharacterEditHelper/*` — cover new markup (Step 7)

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn lint_fix && docker-compose run --rm majora_fe yarn test` (CI jobs: `frontend-checks`, `jasmine`)

## Notes

- No backend or controller (`BaseCharacterEditController`) changes needed — money stays
  a string in page state and a numeric field on submit, exactly as today.
- Do not attempt to make `CoinPacker.pack` replicate `CoinBreakdown`'s threshold-30
  cascade digit-for-digit; only the total value round-trips, not necessarily the exact
  intermediate breakdown for values in the 20-29 range of a denomination — confirmed
  acceptable by the issue author.

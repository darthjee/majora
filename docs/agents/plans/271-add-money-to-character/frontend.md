# Frontend Plan: Add money to character

Main plan: [plan.md](plan.md)

## Shared contracts

- Character API objects (from `CharacterDetailSerializer`/`CharacterFullSerializer`) now
  include an integer `money` field (copper pieces). Not present on list-endpoint items.
- The update PATCH (`CharacterUpdateSerializer`) accepts an optional integer `money` field;
  a negative value returns `400` with `errors.money` populated, same envelope shape as the
  other fields (`fieldErrors` state in `CharacterEdit.jsx`).
- New translation keys (see [plan.md](plan.md#shared-contracts) for the full list and exact
  strings) under `money.*`, plus `pc_edit_page.money_label` / `npc_edit_page.money_label`.
  `Translator.t()` does no interpolation/pluralization — build display strings by
  concatenating the computed quantity with the translated abbreviation/word in JS.

## Implementation Steps

### Step 1 — Coin breakdown transformation utility

Add `frontend/assets/js/utils/CoinBreakdown.js` implementing the cascading algorithm from
the issue exactly (per-denomination step applied to copper → silver → gold → platinum, then
gems overflow). Expose a pure function/static method, e.g.:

```js
CoinBreakdown.build(money) // => [{ key: 'cp', quantity }, { key: 'sp', quantity }, ...,
                            //     { key: 'pp', quantity }, { key: 'gems', quantity }]
```

- Omit any denomination entry (other than the display logic already guaranteeing gems is
  last) whose `quantity` is `0` — filtering zero-quantity entries can happen either inside
  this utility or in the rendering component; pick whichever keeps the utility a pure
  "compute all four + gems" function and the component simple. Prefer filtering in the
  utility so it returns exactly what should be rendered, in display order
  (CP, SP, GP, PP, gems).
- Validate against every row of the issue's examples table (`1` → `1 CP`, `310` →
  `20 CP | 29 SP`, `32220` → `20 CP | 20 SP | 20 GP | 20 PP | 100 GP in gems`, etc.) as unit
  tests — these are the acceptance criteria for the algorithm.

### Step 2 — Money display component

Add `frontend/assets/js/components/elements/CharacterMoney.jsx` (component) — optionally
paired with a `helpers/CharacterMoneyHelper.jsx` if the render logic is non-trivial, matching
the `TreasureCard.jsx`/`TreasureCardHelper.jsx` split pattern already used elsewhere in
`components/elements/`. It takes the raw `money` integer as a prop, runs it through
`CoinBreakdown`, and renders each non-zero denomination using the `money.*_abbreviation`
translation keys (e.g. `` `${quantity} ${Translator.t('money.cp_abbreviation')}` ``) joined
with `" | "` per the issue's example formatting, and the gems row using
`money.gp_in_gems` (e.g. `` `${gemsValue} ${Translator.t('money.gp_in_gems')}` ``). Render
nothing (or an empty fragment) when `money` is `0` — decide based on what reads cleanest
next to the other `col-md-4` content; do not render a bare `"0 CP"` line since `0`-quantity
denominations are always omitted per the issue.

### Step 3 — Wire into the character show page

In `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx`, render
`<CharacterMoney money={character.money} />` inside the `col-md-4` column (alongside
`PhotoUploadOverlay`/`h1`/`LinkList` — the "left side" column per the issue), not inside the
`CharacterInfo` column. Update the `render` JSDoc to document `character.money`.

### Step 4 — Edit form field

In `frontend/assets/js/components/pages/helpers/BaseCharacterEditHelper.jsx`, add a
`FormField` with `type="number"` for `money`, using
`Translator.t(`${i18nNamespace}.money_label`)` as the label (so it resolves to
`pc_edit_page.money_label` / `npc_edit_page.money_label` depending on which page renders
it), `errors={state.fieldErrors.money ?? []}`, and an `id` following the existing
`${idPrefix}-edit-money` convention. Place it in the `col-md-4` column near the name field
(same column the money display lives in on the show page), and update the `render` JSDoc's
`state`/`handlers` param descriptions accordingly.

### Step 5 — Plumb state through the shared edit page and controllers

- `frontend/assets/js/components/pages/shared/CharacterEdit.jsx`: add a `money` state
  (`useState('')`), pass it into `EditHelper.render(...)` state, add
  `onMoneyChange: (event) => setMoney(event.target.value)` to handlers, include `money` in
  the `applyLoadedCharacter` setters call and in the `handleSubmit` `formValues` object.
- `frontend/assets/js/components/pages/controllers/BaseCharacterEditController.js`:
  - `resolveLoadedCharacter`: seed `fields.money` from `character.money ?? 0` (as a string,
    consistent with how the numeric `<input type="number">` value is bound elsewhere, e.g.
    `TreasureEditController`/`TreasureEditHelper` convert only on submit, not on load —
    mirror whichever convention `String(character.money ?? 0)` vs. keeping it numeric turns
    out simplest given how `FormField`'s `value` prop is consumed).
  - `applyLoadedCharacter`: call the new `setMoney` setter with `fields.money`.
  - `submitForm`: include `money: parseInt(formValues.money, 10)` in the fields object
    passed to `handleSubmit` — same conversion pattern as
    `TreasureEditController#submitForm`'s `value: parseInt(formValues.value, 10)`.
  - Update the JSDoc type comments on `resolveLoadedCharacter`, `applyLoadedCharacter`, and
    `submitForm` to include `money`.

### Step 6 — Tests

- `frontend/specs/assets/js/utils/CoinBreakdownSpec.js` (new) — cover every row of the
  issue's examples table plus `0`.
- `frontend/specs/assets/js/components/elements/CharacterMoneySpec.js` (new, mirroring
  `components/elements/CharacterMoney.jsx`) — renders the expected denomination lines,
  omits zero-quantity ones, renders nothing/empty for `money = 0`.
- `frontend/specs/assets/js/components/pages/helpers/CharacterHelperSpec.js` — extend to
  assert `CharacterMoney` receives `character.money`.
- `frontend/specs/assets/js/components/pages/helpers/BaseCharacterEditHelperSpec.js` —
  extend to cover the new money `FormField` (value, `onChange`, `fieldErrors.money`).
- `frontend/specs/assets/js/components/pages/shared/CharacterEditSpec.js` and
  `frontend/specs/assets/js/components/pages/controllers/BaseCharacterEditControllerSpec.js`
  (plus the `...HandleSubmitSpec.js`/`...SubmitFormSpec.js` files) — extend to cover `money`
  flowing from loaded character → form state → submitted payload.

### Step 7 — Run the frontend checks

```
docker-compose run majora_fe npm test
docker-compose run majora_fe npm run lint
```

(Confirm the exact service name against `docker-compose.yml` before running — never invoke
`npm` directly on the host.)

## Files to Change

- `frontend/assets/js/utils/CoinBreakdown.js` — new transformation utility.
- `frontend/assets/js/components/elements/CharacterMoney.jsx` — new display component.
- `frontend/assets/js/components/elements/helpers/CharacterMoneyHelper.jsx` — optional, if split out.
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — render money in the left column.
- `frontend/assets/js/components/pages/helpers/BaseCharacterEditHelper.jsx` — add money input field.
- `frontend/assets/js/components/pages/shared/CharacterEdit.jsx` — add money state/handler/wiring.
- `frontend/assets/js/components/pages/controllers/BaseCharacterEditController.js` — seed/submit `money`.
- `frontend/specs/assets/js/utils/CoinBreakdownSpec.js` — new.
- `frontend/specs/assets/js/components/elements/CharacterMoneySpec.js` — new.
- `frontend/specs/assets/js/components/pages/helpers/CharacterHelperSpec.js` — extend.
- `frontend/specs/assets/js/components/pages/helpers/BaseCharacterEditHelperSpec.js` — extend.
- `frontend/specs/assets/js/components/pages/shared/CharacterEditSpec.js` — extend.
- `frontend/specs/assets/js/components/pages/controllers/BaseCharacterEditControllerSpec.js` (and sibling submit/handle-submit specs) — extend.

## CI Checks

- `frontend`: `npm test` (CI job: `jasmine`)
- `frontend`: `npm run coverage` (CI job referenced alongside `jasmine`/coverage upload)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- Wait for the `translator` agent's keys (or agree on the exact key names up front from
  [plan.md](plan.md#shared-contracts)) before wiring `Translator.t()` calls, so lookups
  don't silently fall back to the raw key string.
- `NpcCharacterEditHelper.jsx`/`PcCharacterEditHelper.jsx` need no changes themselves — they
  only instantiate `BaseCharacterEditHelper` with an `idPrefix`/`i18nNamespace`, so Step 4's
  change covers both NPC and PC edit pages automatically.

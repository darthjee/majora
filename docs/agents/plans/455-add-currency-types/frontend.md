# Frontend Plan: Add currency types

Main plan: [plan.md](plan.md)

## Shared contracts

- `Treasure` API responses (`TreasureDetailSerializer`/`TreasureListSerializer`) gain a
  `game_type` field (`'dnd'` | `'deadlands'`) — use it to resolve the right money model
  for any treasure-scoped display/edit.
- `POST /treasures.json` accepts an optional `game_type`; `POST /games/<slug>/treasures.json`
  ignores any `game_type` sent (server forces it to the game's own type) — so the
  game-scoped treasure creation form must **not** show a type picker, only the standalone
  one should.
- `MoneyModelRegistry.resolve(name)` throws on unknown names, so every call site must
  resolve using an actual `game_type` value, never a hardcoded `'dnd'` string.

## Consolidation note

Most of the issue's 15 "affected places" already funnel through a handful of shared
components, so this isn't 15 separate implementations:

- PC/NPC show pages -> `CharacterHelper.jsx` -> `CharacterMoney.jsx`/`CharacterMoneyHelper.jsx`
- PC/NPC edit pages + NPC new page -> `BaseCharacterEditHelper.jsx` (display) and
  `CharacterEdit.jsx` (shared, mounts `MoneyEditModal.jsx`)
- PC/NPC treasures pages (trade modal) -> `CharacterTreasures.jsx` -> `TreasureExchangeModal.jsx`
- Treasure list/card/show -> `TreasureCardHelper.jsx` / `TreasureHelper.jsx` -> `TreasureMoney.jsx`/`TreasureMoneyHelper.jsx`
- Treasure/game-treasure new+edit forms (4 page/helper trios) -> `TreasureValueField.jsx`,
  which also mounts `MoneyEditModal.jsx` for the value-editing modal

So the real work is: (1) the money-utils layer, (2) making the ~5 shared components above
`game_type`-aware instead of hardcoding `'dnd'`, (3) threading the right `game_type` value
into each of them from its page, (4) the new standalone-treasure type dropdown.

## Implementation Steps

### Step 1 — `DeadlandsMoneyModel`

Add `frontend/assets/js/utils/money/DeadlandsMoneyModel.js`, registered as
`MoneyModelRegistry.register('deadlands', DeadlandsMoneyModel)`, implementing the static
`transform(value, { context })` / `pack(breakdown, { context })` contract `DndMoneyModel`
exposes. **Do not** build it on top of `CoinBreakdown`/`CoinPacker`** — per `plan.md`'s
"Important constraint", their cascade math is hardwired to a base-10 step between
denominations, and Deadlands' dollar is worth 100 cents. Deadlands only has one boundary
(100 cents = 1 dollar) and, per the issue, character and treasure pages use the *same*
rule (unlike D&D, `context` doesn't need to change the behavior — it can be accepted for
interface symmetry with `DndMoneyModel` and ignored):

```js
transform(value) {
  const dollars = Math.floor(value / 100);
  const cents = value % 100;
  return [{ key: 'cents', quantity: cents }, { key: 'dollars', quantity: dollars }]
    .filter((entry) => entry.quantity !== 0);
}
pack(breakdown) {
  return (Number(breakdown.cents) || 0) + (Number(breakdown.dollars) || 0) * 100;
}
```

(Match `DndMoneyModel`'s exact empty/zero-value behavior — e.g. what `transform(0)`
returns — by reading its current tests before finalizing.)

### Step 2 — Move denomination labels onto the money model

`CharacterMoneyHelper.jsx` and `TreasureMoneyHelper.jsx` each currently hardcode their own
`ABBREVIATION_KEYS` map (`cp`/`sp`/`gp`/`pp` -> translation key), which only makes sense
for D&D. Add a label-key lookup to each money model (e.g. a static `labelKey(denominationKey)`
on `DndMoneyModel` returning `'money.cp_abbreviation'` etc., and on `DeadlandsMoneyModel`
returning new `money.cents_abbreviation`/`money.dollars_abbreviation` keys — see
`translator.md`), and have both helpers call the resolved model's `labelKey()` instead of
their own hardcoded map. This is the actual "de-D&D-ing" of these two shared components —
their file/class names are already generic and don't need renaming.

### Step 3 — Thread `game_type` through the three call sites

Change the signatures so every caller supplies the resolved `game_type` instead of the
helper hardcoding `'dnd'`:

- `CharacterMoneyHelper.render(money)` -> `CharacterMoneyHelper.render(money, gameType)`
  (drop the `resolve('dnd')` line; resolve `gameType` instead). Same for
  `TreasureMoneyHelper.render(value)` -> `TreasureMoneyHelper.render(value, gameType)`.
- `MoneyEditModalController.seedBreakdown`/`computeTotal` gain a `gameType` parameter
  (alongside the existing `context`), replacing their own `resolve('dnd')` calls.

### Step 4 — Wire `gameType` into the shared components

- `CharacterMoney.jsx` (+ its helper's caller sites in `CharacterHelper.jsx` and
  `BaseCharacterEditHelper.jsx`): accept a `gameType` prop, sourced from the character's
  own game. Check whether the PC/NPC show/edit page controllers already fetch the game
  (e.g. for permissions) — if so, reuse that; if not, this is the one place a new fetch
  may be needed.
- `MoneyEditModal.jsx` (+ `MoneyEditModalController` usage in `CharacterEdit.jsx`): accept
  a `gameType` prop from the same source as above.
- `TreasureExchangeModal.jsx` (+ controller, used from `CharacterTreasures.jsx`): same —
  derive `gameType` from the character's game.
- `TreasureMoney.jsx`/`TreasureCardHelper.jsx`/`TreasureHelper.jsx`: derive `gameType`
  from the treasure's own `game_type` field (now present on `TreasureDetailSerializer`/
  `TreasureListSerializer`).
- `TreasureValueField.jsx` (used by all four treasure form page/helper trios): accept a
  `gameType` prop.
  - `TreasureNew.jsx`/`TreasureNewHelper.jsx` (standalone): `gameType` comes from the new
    dropdown added in Step 5, defaulting to `'dnd'`.
  - `TreasureEdit.jsx`: `gameType` comes from the fetched treasure's `game_type`.
  - `GameTreasureNew.jsx`/`GameTreasureEdit.jsx`: `gameType` comes from the containing
    game's `game_type` (no picker — the value field just needs to know which denominations
    to render; the server ignores whatever the client sends for `game_type` on this path
    per `backend.md`).

### Step 5 — Standalone treasure creation: currency-type dropdown

In `TreasureNew.jsx`/`TreasureNewHelper.jsx`, add a `game_type` dropdown following the
same pattern as the Game creation dropdown from #454 (`dnd` -> "D&D", `deadlands` ->
"Deadlands", untranslated option labels, translated field label), defaulting to `'dnd'`,
and include `game_type` in the create payload. `TreasureEdit.jsx` and both
`GameTreasureNew.jsx`/`GameTreasureEdit.jsx` do **not** get this dropdown (fixed/forced,
per the issue).

### Step 6 — Tests

Update specs for every file touched above (helpers, controllers, and the new
`DeadlandsMoneyModel`), plus:
- A new `DeadlandsMoneyModel` spec mirroring `DndMoneyModel`'s existing spec structure.
- `TreasureNewHelperSpec.js` (or equivalent): dropdown renders/submits correctly.
- Update every spec that currently asserts on the old `resolve('dnd')`-only behavior of
  `CharacterMoneyHelper`/`TreasureMoneyHelper`/`MoneyEditModalController` to pass an
  explicit `gameType` and cover both `'dnd'` and `'deadlands'`.

## CI Checks

- `npm test` / `npm run coverage` (CI job: `jasmine`)
- `npm run lint` (CI job: `frontend-checks`)

## Notes

- No file/class renames are actually needed — `CharacterMoney`, `TreasureMoney`,
  `MoneyEditModal`, `TreasureExchangeModal`, `TreasureValueField` are already
  system-agnostic names. The D&D-coupling being removed is behavioral (hardcoded
  `resolve('dnd')` and the hardcoded CP/SP/GP/PP abbreviation map), not nominal.
- Double-check `DndMoneyModel`'s zero-value and single-denomination edge cases before
  writing `DeadlandsMoneyModel`, so both models agree on what "no money" renders as.

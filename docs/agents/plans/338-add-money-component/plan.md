# Plan: Add money component

Issue: [338-add-money-component.md](../../issues/338-add-money-component.md)

## Overview

Introduce a small "money model" registry in `frontend/assets/js/utils/` that formalizes the
currency-conversion behavior currently duplicated (with different configuration) between
`CharacterMoneyHelper` and `TreasureMoneyFormatter`. Both call sites are refactored to go
through a single `dnd` model resolved from the registry, each requesting its own context
(`character` or `treasure`), while keeping their current display output byte-for-byte
identical. This is a pure frontend refactor — no backend, proxy, infra, or translation
changes are needed.

## Context

- `CharacterMoneyHelper.render` (`frontend/assets/js/components/elements/helpers/CharacterMoneyHelper.jsx`)
  builds a `new CoinBreakdown().build(money)` (default denominations `cp/sp/gp/pp`, cascade
  threshold 30, overflow into `gems`), then renders a pipe-separated `<p className="character-money">`
  line, or `null` when there are no entries (money is 0).
- `formatTreasureValue` (`frontend/assets/js/utils/TreasureMoneyFormatter.js`) builds a
  `new CoinBreakdown({ denominations: ['cp', 'sp', 'gp'], cascadeThreshold: 10 }).build(value)`,
  reverses the entries (highest first), joins them as a sentence (`"1000 GP, 5 SP and 2 CP"`),
  and returns `"0 GP"` when there are no entries.
- `CoinBreakdown` (`frontend/assets/js/utils/CoinBreakdown.js`) is the shared low-level cascade
  arithmetic class and is not changed by this issue — both contexts keep using it internally,
  just through the new model instead of being configured ad hoc at each call site.
- `formatTreasureValue` is called from three helpers: `TreasureCardHelper.jsx`,
  `pages/helpers/TreasureHelper.jsx`, and `TreasureExchangeModalHelper.jsx` (twice, for the
  list item and the selected-item summary).
- No `Money`/model registry concept exists yet anywhere in the frontend.

## Implementation Steps

### Step 1 — Add the money model registry

Create `frontend/assets/js/utils/money/MoneyModelRegistry.js`: a static class exposing
`register(name, modelClass)` and `resolve(name)` (throwing a clear error for an unknown
name). Pre-register the `dnd` model at the bottom of `DndMoneyModel.js` (see Step 2) via a
side-effecting `MoneyModelRegistry.register('dnd', DndMoneyModel)` call, mirroring how other
singleton-ish registration patterns in this codebase self-register on import (avoids a
separate manual bootstrap step). Add a matching spec
`frontend/specs/assets/js/utils/money/MoneyModelRegistrySpec.js` covering register/resolve
and the unknown-name error.

### Step 2 — Add the `dnd` money model

Create `frontend/assets/js/utils/money/DndMoneyModel.js`, a static class exposing
`transform(value, { context })`. Internally it holds the two existing configurations as
private static context configs:

```js
{
  character: { denominations: ['cp', 'sp', 'gp', 'pp'], cascadeThreshold: 30 },
  treasure:  { denominations: ['cp', 'sp', 'gp'],        cascadeThreshold: 10 },
}
```

`transform` looks up the config for the given `context` (throwing for an unrecognized
context), builds a `CoinBreakdown` with it, and calls `.build(value)`, returning the same
`{key, quantity}[]` shape `CoinBreakdown.build` already returns today (including the
`gems` overflow entry for `character`, since it uses the default denominations). This
keeps `transform`'s output format identical to what `CharacterMoneyHelper` and
`TreasureMoneyFormatter` already consume from `CoinBreakdown` directly, so the presentation
layer changes in Steps 3-4 are pure call-site swaps, not reformatting. Add
`frontend/specs/assets/js/utils/money/DndMoneyModelSpec.js`, adapting the existing
assertions from `CoinBreakdownSpec.js`/`TreasureMoneyFormatterSpec.js` for both contexts
(including the cascade-threshold and gems-overflow behavior for `character`, and the
CP/SP/GP-only cap for `treasure`).

### Step 3 — Refactor `CharacterMoneyHelper` to use the model

Update `CharacterMoneyHelper.render` to resolve the `dnd` model via
`MoneyModelRegistry.resolve('dnd')` and call `.transform(money, { context: 'character' })`
instead of instantiating `CoinBreakdown` directly. Formatting (`#formatEntry`, the `|`
join, and the `null`-on-empty behavior) is unchanged. Update
`CharacterMoneySpec.js`/`CharacterMoneyHelperSpec.js` only as needed to keep them passing
(no behavioral assertions should need to change).

### Step 4 — Replace `TreasureMoneyFormatter` with a proper component

Per the issue, the treasure display becomes "a proper component" rather than a bare
formatting function:

- Create `frontend/assets/js/components/elements/TreasureMoney.jsx` (component) +
  `frontend/assets/js/components/elements/helpers/TreasureMoneyHelper.jsx` (static render
  helper), following the existing `CharacterMoney.jsx`/`CharacterMoneyHelper.jsx` pattern
  (no controller needed — this is a pure presentational element, same as `CharacterMoney`).
  `TreasureMoneyHelper.render(value)` resolves `dnd` via `MoneyModelRegistry.resolve('dnd')`,
  calls `.transform(value, { context: 'treasure' })`, and reproduces the exact current
  output of `formatTreasureValue` (reverse to highest-first, comma+"and" join via the
  existing private join logic ported over, `"0 GP"` for an empty/zero value).
- Update the three call sites — `TreasureCardHelper.jsx`, `pages/helpers/TreasureHelper.jsx`,
  `TreasureExchangeModalHelper.jsx` (both usages) — to render `<TreasureMoney value={...} />`
  instead of calling `formatTreasureValue(...)` inline as a string. Since all four current
  call sites interpolate the formatted string directly into JSX text content (e.g.
  `<p>{formatTreasureValue(treasure.value)}</p>`), swapping in `<TreasureMoney value={...} />`
  in the same position preserves the rendered output.
- Delete `frontend/assets/js/utils/TreasureMoneyFormatter.js` and its spec
  (`frontend/specs/assets/js/utils/TreasureMoneyFormatterSpec.js`), porting the relevant
  assertions into a new `frontend/specs/assets/js/components/elements/TreasureMoneySpec.js`
  (rendered via `renderToStaticMarkup`, consistent with how `CharacterMoneySpec.js` tests
  `CharacterMoney`) and/or
  `frontend/specs/assets/js/components/elements/helpers/TreasureMoneyHelperSpec.js`.
- Update `TreasureCardHelperSpec.js`, `pages/helpers/TreasureHelperSpec.js`, and the
  `TreasureExchangeModalHelper` spec directory to assert the new `<TreasureMoney>` markup is
  present instead of the raw formatted string, only where the existing assertions relied on
  the exact string output of `formatTreasureValue`.

### Step 5 — Full local verification

Run the full frontend dev cycle (lint, tests, i18n key-parity check — this issue adds no
new translation keys, so `check_i18n` should pass unchanged) inside the `majora_fe` container
before committing, per `AGENTS.md`.

## Files to Change

- `frontend/assets/js/utils/money/MoneyModelRegistry.js` — new: name-based model registry.
- `frontend/assets/js/utils/money/DndMoneyModel.js` — new: `dnd` model, context-aware
  `transform()`, registers itself on the registry.
- `frontend/assets/js/components/elements/helpers/CharacterMoneyHelper.jsx` — resolve `dnd`
  model via the registry instead of instantiating `CoinBreakdown` directly.
- `frontend/assets/js/components/elements/TreasureMoney.jsx` — new: treasure money display
  component (replaces `TreasureMoneyFormatter.js`).
- `frontend/assets/js/components/elements/helpers/TreasureMoneyHelper.jsx` — new: render
  helper for `TreasureMoney`, resolving `dnd` model with the `treasure` context.
- `frontend/assets/js/components/elements/helpers/TreasureCardHelper.jsx` — use
  `<TreasureMoney>` instead of `formatTreasureValue`.
- `frontend/assets/js/components/pages/helpers/TreasureHelper.jsx` — use `<TreasureMoney>`
  instead of `formatTreasureValue`.
- `frontend/assets/js/components/elements/helpers/TreasureExchangeModalHelper.jsx` — use
  `<TreasureMoney>` (both usages) instead of `formatTreasureValue`.
- `frontend/assets/js/utils/TreasureMoneyFormatter.js` — deleted.
- `frontend/specs/assets/js/utils/money/MoneyModelRegistrySpec.js` — new.
- `frontend/specs/assets/js/utils/money/DndMoneyModelSpec.js` — new.
- `frontend/specs/assets/js/components/elements/TreasureMoneySpec.js` — new.
- `frontend/specs/assets/js/components/elements/helpers/TreasureMoneyHelperSpec.js` — new.
- `frontend/specs/assets/js/utils/TreasureMoneyFormatterSpec.js` — deleted.
- `frontend/specs/assets/js/components/elements/helpers/CharacterMoneyHelperSpec.js`,
  `frontend/specs/assets/js/components/elements/CharacterMoneySpec.js` — updated only if
  needed to keep passing.
- `frontend/specs/assets/js/components/elements/helpers/TreasureCardHelperSpec.js`,
  `frontend/specs/assets/js/components/pages/helpers/TreasureHelperSpec.js`,
  `frontend/specs/assets/js/components/elements/helpers/TreasureExchangeModalHelper/*` —
  updated to match the new `<TreasureMoney>` markup.

## CI Checks

- `frontend`: `docker-compose run majora_fe npm run lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run majora_fe npm run check_i18n` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run majora_fe npm run coverage` (or `npm test`) (CI job: `jasmine`)

## Notes

- `CoinBreakdown.js` itself is intentionally left unchanged — the issue only asks to unify
  the *configuration* of denominations/cascade-threshold behind a model, not to rewrite the
  cascade arithmetic.
- The future dollar-based model is explicitly out of scope; the registry's `register`/
  `resolve` API is name-based specifically so it needs no change to accommodate a second
  model later.
- Whether `TreasureMoney.jsx` needs its own `controllers/` file is a judgment call at
  implementation time — per `docs/agents/frontend.md`, elements only get a controller when
  they have non-trivial logic; this one is purely presentational like `CharacterMoney.jsx`,
  so no controller is expected.

# Plan: D&D money coins overhauling

Issue: [609-d-d-money-coins-overhauling.md](../../issues/609-d-d-money-coins-overhauling.md)

## Overview

Replace the pipe-separated money text line (`20 CP | 5 SP | 3 GP`) with a stack of four always-present coin boxes (CP, SP, GP, PP) — icon + abbreviation + amount, colored per denomination — on the `dnd` character/NPC show and edit pages. Only the `dnd` rendering path changes; `deadlands` keeps the existing text line untouched.

## Context

`CharacterMoney` (`frontend/assets/js/components/resources/character/pages/elements/CharacterMoney.jsx`) is the single rendering path shared by:
- The character/NPC show page (`CharacterHelper.jsx`, left column).
- The character/NPC edit page, via `CharacterMoneyField` → `CharacterMoneyFieldHelper`, which renders `CharacterMoney` above the "Edit money" button.

Its current implementation (`CharacterMoneyHelper.render`) calls `MoneyModelRegistry.resolve(gameType).transform(money, { context: 'character' })`, which for `dnd` goes through `DndMoneyModel.transform` → `CoinBreakdown.build`. `CoinBreakdown.build` filters out zero-quantity entries (`entries.filter((entry) => entry.quantity !== 0)`, `frontend/assets/js/utils/money/CoinBreakdown.js:100`) and returns `[]` (rendering `null`) when money is 0 — both behaviors need to change for the new dense, always-four-boxes display, but only for `dnd`.

The `frontend/assets/css/main.scss` file already has an established pattern for a colorable single-path SVG icon, used by `.bi-skull`/`.bi-skull-fill` (lines 124–148): a `background-color: currentColor` element with `mask-image`/`-webkit-mask-image` pointing at the SVG, sized via `width`/`height`. The new coin icon should reuse this exact pattern against `frontend/assets/images/icons/coins.svg`, so tinting is just a `color` change per denomination class — no border/outline needed (per discussion, PP uses a darker/more saturated platinum-grey shade instead of a border for contrast).

Translation keys already exist and don't need changes: `money.cp_abbreviation`/`sp_abbreviation`/`gp_abbreviation`/`pp_abbreviation` in `frontend/assets/i18n/en.yaml` (CP/SP/GP/PP) and `frontend/assets/i18n/pt.yaml` (PC/PP/PO/PL).

## Implementation Steps

### Step 1 — Add a dense (zero-inclusive) breakdown path

Add a way to get all four `cp`/`sp`/`gp`/`pp` entries for the `character` context without the zero-quantity filter, without touching the existing filtered behavior used elsewhere (e.g. `treasure` context, `deadlands`):
- Add `CoinBreakdown#buildDense(money)` alongside `build()` in `CoinBreakdown.js`, sharing the same cascade logic but skipping the final `.filter(...)` step (e.g. extract the shared entry-building into a private method both call).
- Add `DndMoneyModel.transformDense(value, { context })`, mirroring `transform`, calling `buildDense` instead of `build`.
- This only needs to support the `character` context (the only place the dense view is used); no change needed to `MoneyModelRegistry`, `DeadlandsMoneyModel`, or the `treasure` context.

### Step 2 — Build the coin box components

Create a new coin-box element (naming follows the existing `Character*` element/helper split, e.g. `CharacterMoneyCoins.jsx` + `helpers/CharacterMoneyCoinsHelper.jsx`, or fold directly into `CharacterMoneyHelper` if that stays simpler — judge based on size once written):
- One component/render path per coin denomination, rendering: the masked coin icon, the translated abbreviation (`Translator.t(DndMoneyModel.labelKey(key))`), and the amount (defaulting to `0`).
- A container stacking the four denomination boxes vertically, in `cp, sp, gp, pp` order (low to high value).
- Denomination-specific coloring via a CSS class per key (e.g. `coin-box-cp`, `coin-box-sp`, `coin-box-gp`, `coin-box-pp`), each setting `color` to the copper/oxidised-silver/gold/darker-platinum shade — the mask icon inherits it via `currentColor`, and the abbreviation/amount text inherits it naturally.

### Step 3 — Wire it into `CharacterMoneyHelper`

Update `CharacterMoneyHelper.render(money, gameType)`:
- For `gameType === 'dnd'`, use `DndMoneyModel.transformDense(money, { context: 'character' })` and render the new coin-box stack (always 4 boxes, regardless of `money` being 0).
- For any other `gameType` (i.e. `deadlands`), keep today's behavior exactly as-is: `MoneyModelRegistry.resolve(gameType).transform(...)`, pipe-joined line, `null` when empty.

### Step 4 — Styling

Add to `frontend/assets/css/main.scss`:
- `.coin-icon` (or similarly named) mask-based icon rule, following the `.bi-skull`/`.bi-skull-fill` pattern, pointing at `../images/icons/coins.svg`.
- Box layout rules for the coin row (icon + abbreviation + amount, horizontally aligned) and the vertical stack container.
- The four `coin-box-{cp,sp,gp,pp}` color classes with the copper/oxidised-silver/gold/darker-platinum-grey values.

### Step 5 — Tests

- `frontend/specs/assets/js/utils/money/CoinBreakdownSpec.js`: add cases for `buildDense` (all four entries present including zeros, cascading/absorption behavior unchanged from `build`).
- `frontend/specs/assets/js/utils/money/DndMoneyModelSpec.js`: add cases for `transformDense`.
- `frontend/specs/assets/js/components/resources/character/pages/elements/CharacterMoneySpec.js`: the existing `dnd` cases (pipe-joined line, omitting zero denominations, rendering nothing at 0) no longer hold for `dnd` — rewrite them to assert all four boxes always render (including `0` amounts) and check for the four abbreviations/values instead of the `|`-joined string. The `deadlands` cases (cents/dollars line, unaffected) stay as-is.
- Add/adjust specs for whatever new component(s) Step 2 introduces (e.g. `CharacterMoneyCoinsSpec.js`) if split into their own file(s).

## Files to Change

- `frontend/assets/js/utils/money/CoinBreakdown.js` — add `buildDense`.
- `frontend/assets/js/utils/money/DndMoneyModel.js` — add `transformDense`.
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyHelper.jsx` — branch `dnd` vs. other game types.
- New coin-box component + helper file(s) under `frontend/assets/js/components/resources/character/pages/elements/` (exact naming decided during implementation).
- `frontend/assets/css/main.scss` — coin icon mask rule, box/stack layout, per-denomination color classes.
- `frontend/specs/assets/js/utils/money/CoinBreakdownSpec.js`, `DndMoneyModelSpec.js`, `CharacterMoneySpec.js` — new/updated cases per Step 5, plus specs for any new component file(s).

No backend changes: `character.money` and `character.game_type` are already exposed to the frontend today (`CharacterHelper.jsx` already consumes both).

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes

- This only affects the `dnd` game type, confirmed during discussion — `deadlands` money rendering must stay byte-for-byte the same.
- Treasures and the trade treasures modal are explicitly out of scope and must not change.
- Exact color hex values (copper/oxidised-silver/gold/darker-platinum) are left to implementation-time judgment — no specific hex codes were mandated during discussion, only the qualitative description plus "darker platinum shade, no border" for PP.
- `coins.svg` is a single generic glyph reused for all four denominations — distinction is by color only, not by four different icons.

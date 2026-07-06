# Plan: Show treasure in GP

Issue: [311-show-treasure-in-gp.md](../../issues/311-show-treasure-in-gp.md)

## Overview
Refactor `CoinBreakdown` from a static-method utility into an instantiable class that
supports a restricted, caller-chosen subset of denominations where the last denomination
in the subset absorbs all remaining value (no cascading past it, no cap). Reuse it from a
new `TreasureMoneyHelper`-style formatter (or inline in the existing helpers) to render
treasure values as a `CP`/`SP`/`GP` breakdown, joined with commas and a trailing "and",
in both the treasures list card and the treasure detail page.

## Context
- `CoinBreakdown.build(money)` (frontend/assets/js/utils/CoinBreakdown.js) is currently a
  static method hard-coded to the 4 denominations `cp, sp, gp, pp` plus a `gems` overflow,
  using a cascade threshold of 30 for the character-money use case.
- `CharacterMoneyHelper.render` (frontend/assets/js/components/elements/helpers/CharacterMoneyHelper.jsx)
  is the only current consumer; it maps entries through `money.cp_abbreviation`,
  `money.sp_abbreviation`, `money.gp_abbreviation`, `money.pp_abbreviation`, and
  `money.gp_in_gems` i18n keys, joined with `' | '`. This join style and the `pp`/`gems`
  denominations are specific to character money and must not change.
- `TreasureCardHelper.render` (frontend/assets/js/components/elements/helpers/TreasureCardHelper.jsx)
  and `TreasureHelper.render` (frontend/assets/js/components/pages/helpers/TreasureHelper.jsx)
  both currently render `treasure.value` as a raw number.
- Needed i18n keys (`money.cp_abbreviation`, `money.sp_abbreviation`, `money.gp_abbreviation`)
  already exist in `frontend/assets/i18n/*.yaml` — no translation work is required.
- There is no existing "list join with a trailing and" utility in the codebase; a small
  local helper (e.g. `entries.length > 1 ? [...all but last].join(', ') + ' and ' + last : last`)
  is sufficient — no i18n key exists for the word "and", and other UI strings in these same
  helpers (e.g. `TreasureHelper`'s "Value:") are already hard-coded in English, so a
  hard-coded "and" is consistent with current style.
- `frontend/specs/assets/js/utils/CoinBreakdownSpec.js` and
  `frontend/specs/assets/js/components/elements/helpers/TreasureCardHelperSpec.js` and
  `frontend/specs/assets/js/components/elements/helpers/CharacterMoneyHelperSpec.js` are the
  existing specs that must keep passing; there is currently no `TreasureHelperSpec.js`.

## Implementation Steps

### Step 1 — Turn `CoinBreakdown` into an instantiable class
- Add a constructor accepting an options object, e.g.
  `new CoinBreakdown({ denominations, cascadeThreshold })`, where:
  - `denominations` defaults to `['cp', 'sp', 'gp', 'pp']` (preserving today's behavior,
    with the `gems` overflow entry appended when the last denomination in the list is
    exhausted and value remains — keep this gems-overflow behavior gated to the default
    4-denomination case, since the treasure use case's `gp` must absorb everything
    instead of overflowing).
  - `cascadeThreshold` defaults to `30` (today's `CASCADE_THRESHOLD`).
- Add a `build(money = 0)` instance method with the same cascading logic as today's
  static method, but:
  - Only cascades through `denominations.length - 1` steps; the final denomination in the
    list absorbs all remaining value directly (no `cascadeStep` cap, no overflow entry).
  - Still filters out zero-quantity entries, EXCEPT it must special-case the treasure
    "value 0" requirement (see Step 3) — that special case belongs in the caller, not in
    `CoinBreakdown` itself, since `CharacterMoneyHelper` still needs "0 shows nothing".
- Keep a default export of the class (not static methods anymore). Update the only
  existing caller, `CharacterMoneyHelper`, to instantiate it:
  `new CoinBreakdown().build(money)` (equivalent to today's `CoinBreakdown.build(money)`,
  using default denominations `['cp','sp','gp','pp']` and default threshold `30`).
- Keep exporting `cascadeStep` unchanged (already a plain function, still useful
  standalone and already covered by its own spec block).

### Step 2 — Add a treasure-specific breakdown + formatter
- Add a small helper (either a new `frontend/assets/js/utils/TreasureMoneyFormatter.js`
  or a private static method colocated in one of the two treasure helpers and imported by
  the other — prefer a small shared util to avoid duplicating the join logic between
  `TreasureCardHelper` and `TreasureHelper`) that:
  - Builds entries via `new CoinBreakdown({ denominations: ['cp', 'sp', 'gp'], cascadeThreshold: 10 }).build(value)`.
  - Special-cases `value === 0` (or an empty entries array) to render `0 GP` (a synthetic
    `{ key: 'gp', quantity: 0 }` entry), since this differs from `CharacterMoneyHelper`'s
    "show nothing" behavior for 0.
  - Formats entries highest-to-lowest denomination — `CoinBreakdown.build` already returns
    entries in ascending order (`cp, sp, gp`); reverse before formatting so the highest
    denomination (GP) comes first, matching the issue's example ordering.
  - Maps each entry through the existing `money.cp_abbreviation` / `money.sp_abbreviation`
    / `money.gp_abbreviation` i18n keys (same `Translator.t` pattern as
    `CharacterMoneyHelper`).
  - Joins multiple entries with `', '` and a final `' and '` (Oxford-comma-free, matching
    the issue's examples exactly: `1000 GP, 5 SP and 2 CP` / `1001 GP and 5 SP`).

### Step 3 — Wire the formatter into both treasure views
- `TreasureCardHelper.render`: replace `<p className="card-text text-muted mb-0">{treasure.value}</p>`
  with the same paragraph rendering the formatted breakdown string instead of the raw
  number.
- `TreasureHelper.render`: replace the raw `{treasure.value}` in the `<strong>Value:</strong>`
  paragraph with the formatted breakdown string.

### Step 4 — Update/add specs
- Update `CoinBreakdownSpec.js` for the new instantiable API (`new CoinBreakdown().build(...)`
  and `new CoinBreakdown({ denominations, cascadeThreshold }).build(...)`), keeping all
  existing default-behavior assertions intact (they must still pass unchanged in outcome,
  only the call syntax changes).
- Update `CharacterMoneyHelperSpec.js` only if the internal `CoinBreakdown` call syntax
  change requires it (behavioral expectations should be unaffected).
- Update `TreasureCardHelperSpec.js`'s value-rendering assertions to expect the formatted
  breakdown (e.g. value `500` → `5 GP`) instead of the raw number.
- Add `frontend/specs/assets/js/components/pages/helpers/TreasureHelperSpec.js` (does not
  exist yet) covering at least: basic render, value breakdown formatting, the 0-value
  `0 GP` case, the edit-link behavior already implemented in `#renderEditLink`, and loading
  / error states.
- Add spec cases for the new treasure-formatter covering the issue's explicit examples:
  `100052` → `1000 GP, 5 SP and 2 CP`, `100150` → `1001 GP and 5 SP`, `0` → `0 GP`,
  `100000` → `1000 GP`.

## Files to Change
- `frontend/assets/js/utils/CoinBreakdown.js` — convert to an instantiable class
  supporting a configurable denomination subset (last one absorbs all remaining value)
  and configurable cascade threshold.
- `frontend/assets/js/components/elements/helpers/CharacterMoneyHelper.jsx` — update the
  `CoinBreakdown` call site to the new instance API, preserving current behavior.
- `frontend/assets/js/components/elements/helpers/TreasureCardHelper.jsx` — render the
  CP/SP/GP breakdown instead of the raw `treasure.value`.
- `frontend/assets/js/components/pages/helpers/TreasureHelper.jsx` — render the CP/SP/GP
  breakdown instead of the raw `treasure.value`.
- New shared util (e.g. `frontend/assets/js/utils/TreasureMoneyFormatter.js`) — builds and
  formats the treasure-specific breakdown string, reused by both treasure helpers above.
- `frontend/specs/assets/js/utils/CoinBreakdownSpec.js` — update for the new instance API.
- `frontend/specs/assets/js/components/elements/helpers/CharacterMoneyHelperSpec.js` —
  adjust only if needed.
- `frontend/specs/assets/js/components/elements/helpers/TreasureCardHelperSpec.js` — update
  value assertions for the new formatted output.
- New `frontend/specs/assets/js/components/pages/helpers/TreasureHelperSpec.js` — full spec
  coverage for `TreasureHelper` (none exists today).
- New spec file for the treasure money formatter util (colocated next to the new util
  under `frontend/specs/assets/js/utils/`).

## CI Checks
- `frontend`: `docker-compose run --rm frontend npm run lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm frontend npm run coverage` (CI job: `jasmine`)

## Notes
- Do not change `CharacterMoneyHelper`'s behavior, its `' | '` join style, or its `pp`/gems
  handling — only its call syntax into `CoinBreakdown` may change.
- The treasure breakdown's "0 displays as `0 GP`" rule is the opposite of
  `CharacterMoneyHelper`'s "0 shows nothing" rule — keep this special case in the
  treasure-specific formatter, not in `CoinBreakdown` itself.
- No backend, infra, proxy, or translation changes are needed — the required i18n keys
  already exist and no API/serializer changes are involved.

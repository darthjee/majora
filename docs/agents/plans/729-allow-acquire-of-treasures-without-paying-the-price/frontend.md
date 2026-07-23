# Frontend Plan: Allow acquire of treasures without paying the price

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the six new backend endpoints and response shapes documented in
[plan.md](plan.md)'s "Shared contracts" section. Consumes the four new translation keys
(`treasure_exchange_modal.acquire_tab`, `.acquire_tab_tooltip`, `.remove_tab`,
`.remove_tab_tooltip`) produced by the `translator` agent — do not add these keys yourself,
just reference them via `Translator.t()`.

## Implementation Steps

### Step 1 — Add `CharacterClient` methods

In `frontend/assets/js/client/CharacterClient.js`, add `acquireTreasure`, `acquireTreasureAll`,
`removeTreasure`, mirroring `buyTreasure`/`buyTreasureAll`/`sellTreasure` (lines 149-213)
exactly — same signature shape, just posting to `.../treasures/acquire.json`,
`.../treasures/acquire/all.json`, `.../treasures/remove.json`.

### Step 2 — Add `AcquireTreasureTabController`/`RemoveTreasureTabController`

Under `frontend/assets/js/components/resources/character/pages/elements/tabs/controllers/`:

- `AcquireTreasureTabController.js` — copy `BuyTreasureTabController.js` structure. Key
  differences:
  - `buildBrowseParams` must **not** set `maxValue` (drop that key entirely from the query, so
    the Acquire tab lists the full catalog, not money-filtered) — everything else
    (`page`/`perPage`/`search`/`ordering`) stays the same.
  - `fetchPage` still goes through `RequestStore` with `resource: 'treasure'`,
    `quantityType: 'collection'`, `params: { gameSlug, kind: 'game' }` — same resource config
    as Buy, no new `RequestStore`/`treasureConfig.js` entry needed, just a different query.
  - `acquire`/`confirmAcquire` mirror `buy`/`confirmBuy`, calling
    `characterClient.acquireTreasureAll`/`acquireTreasure` instead of the buy equivalents.
    `ERROR_KEY_BY_MESSAGE` has no `insufficient funds` entry (that error can't happen here) —
    only the generic fallback.
- `RemoveTreasureTabController.js` — copy `SellTreasureTabController.js` structure verbatim
  (same `RequestStore` `ownedCollection` resource, same `ERROR_KEY_BY_MESSAGE` with
  `'not enough owned'`), just calling `characterClient.removeTreasure` instead of
  `sellTreasure`.

### Step 3 — Add `AcquireTreasureTabHelper`/`RemoveTreasureTabHelper`

Under `.../tabs/helpers/`: copy `BuyTreasureTabHelper.jsx`/`SellTreasureTabHelper.jsx`
verbatim (both already share `ExchangeDetailPane`, `BrowsePager`, `TreasureMoney` with no
money-specific rendering in the shared pane itself — no changes needed to
`ExchangeDetailPane.jsx`). Only the translation-key strings referenced for the tab-specific
copy (if any beyond what `ExchangeDetailPane` already covers) need re-pointing — check each
helper's `Translator.t('treasure_exchange_modal....')` calls are all still valid generic keys
(they are: `search_placeholder`, `loading`, `empty`, `already_owned`, `quantity_label`,
`confirm`, `cancel_selection`, `available_units_badge` — none are Buy/Sell-specific wording).

### Step 4 — Add `AcquireTreasureTab`/`RemoveTreasureTab` components

Under `.../tabs/`: copy `BuyTreasureTab.jsx`/`SellTreasureTab.jsx` verbatim, wiring the new
controller/helper pairs from Steps 2-3. Same props shape (`show`, `character`,
`ownedTreasures`, `gameType`, `onSuccess`).

### Step 5 — Register the new tabs

In `treasureExchangeTabs.js`, add the `acquire`/`remove` entries shown in
[plan.md](plan.md)'s shared contracts. No changes needed to `TreasureExchangeModal.jsx` or
`TreasureExchangeModalHelper.jsx` — the shell is already tab-agnostic (confirmed by its own
doc comment).

### Step 6 — Frontend specs

Mirror the existing Buy/Sell spec structure for each new piece:

- `treasureExchangeTabsSpec.js` — add `acquire`/`remove` config-shape assertions (mirror the
  existing `buy`/`sell` cases).
- `tabs/AcquireTreasureTabSpec.js` / `RemoveTreasureTabSpec.js` — mirror
  `BuyTreasureTabSpec.js`/`SellTreasureTabSpec.js`.
- `tabs/controllers/AcquireTreasureTabController/` — mirror the `BuyTreasureTabController/`
  spec dir (`buildBrowseParamsSpec.js` asserting no `maxValue` key, `buySpec.js`→`acquireSpec.js`,
  `confirmBuySpec.js`→`confirmAcquireSpec.js`, `loadPageSpec.js`, `fetchPageSpec.js`, `support.js`).
- `tabs/controllers/RemoveTreasureTabController/` — mirror `SellTreasureTabController/` specs.
- `tabs/helpers/AcquireTreasureTabHelper/` / `RemoveTreasureTabHelper/` — mirror the
  Buy/Sell helper spec dirs.
- `client/CharacterClient/acquireTreasureSpec.js`, `acquireTreasureAllSpec.js`,
  `removeTreasureSpec.js` — mirror `buyTreasureSpec.js`/`buyTreasureAllSpec.js`/`sellTreasureSpec.js`.

## Files to Change

- `frontend/assets/js/client/CharacterClient.js` — add 3 methods
- `frontend/assets/js/components/resources/character/pages/elements/tabs/AcquireTreasureTab.jsx` — new
- `frontend/assets/js/components/resources/character/pages/elements/tabs/RemoveTreasureTab.jsx` — new
- `.../tabs/controllers/AcquireTreasureTabController.js`, `RemoveTreasureTabController.js` — new
- `.../tabs/helpers/AcquireTreasureTabHelper.jsx`, `RemoveTreasureTabHelper.jsx` — new
- `frontend/assets/js/components/resources/character/pages/elements/treasureExchangeTabs.js` — register 2 new entries
- `frontend/specs/.../treasureExchangeTabsSpec.js` — extend
- `frontend/specs/.../tabs/AcquireTreasureTabSpec.js`, `RemoveTreasureTabSpec.js` — new
- `frontend/specs/.../tabs/controllers/AcquireTreasureTabController/*`, `RemoveTreasureTabController/*` — new
- `frontend/specs/.../tabs/helpers/AcquireTreasureTabHelper/*`, `RemoveTreasureTabHelper/*` — new
- `frontend/specs/assets/js/client/CharacterClient/acquireTreasureSpec.js`,
  `acquireTreasureAllSpec.js`, `removeTreasureSpec.js` — new

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)

## Notes

- No new `RequestStore`/`treasureConfig.js` resource-config entries needed — Acquire reuses
  Buy's `treasure.collection`/`kind: 'game'` (just without `maxValue`), Remove reuses Sell's
  `treasure.ownedCollection`.
- Do not add or edit i18n YAML content yourself — that's the `translator` agent's file; just
  reference the new keys.

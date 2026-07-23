# Frontend Plan: Refactor treasure exchange modal

Main plan: [plan.md](plan.md)

## Shared contracts

- Calls the backend's renamed endpoints via renamed `CharacterClient` methods: `buyTreasure`/`buyTreasureAll` (was `acquireTreasure`/`acquireTreasureAll`), hitting `.../treasures/buy.json` / `.../treasures/buy/all.json`. `sellTreasure` is unchanged.
- Consumes the same response shape as today: buy → `{quantity, money, acquired}` (keep the `acquired` field name), sell → `{quantity, money}`.
- Calls i18n keys `treasure_exchange_modal.buy_tab`, `.buy_tab_tooltip`, `.sell_tab_tooltip`, `.cancel_selection` (renamed from `.back`) — see [translator.md](translator.md) for exact copy; these must exist before/alongside this work lands, or `Translator.t()` will fall back to the raw key.
- Introduces a Sell-safe collection resource-config variant (see Step 4) whose `private` path never elevates to the hidden-inclusive `all.json` — this is new, frontend-internal surface, not consumed by any other agent, but is visibility-sensitive and worth a security-minded look during review.

## Current state (for context)

`TreasureExchangeModal.jsx` + `controllers/TreasureExchangeModalController.js` + `helpers/TreasureExchangeModalHelper.jsx` (same folder) currently own everything: tab state, browse/selected/quantity/submit state, and branch on `activeTab === 'acquire'` throughout. Buy's list already goes through `RequestStore` (`treasureConfig.js`, `kind: 'game'`); Sell's list and both submits call `CharacterClient` directly. The modal already has a `Cancel` button in the footer (closes the whole modal) and a `Back` link in the detail view (returns to the list) — neither is the "Cancel next to Confirm" the issue asks for; that's a new button, not a rename of an existing one used for a different purpose (though the `Back` link's underlying behavior — clear `selected`, don't submit — is exactly what the new button needs, so reuse `handleBack`/`onBack` under the new label/position).

## Implementation Steps

### Step 1 — Build the tab shell + config map

Reduce `TreasureExchangeModal.jsx` to a shell that owns only: `show`, `activeTab` (default `'buy'`), and the character/game context. It renders:
- Modal chrome (title, money display, footer `Cancel` button that closes the modal) — unchanged.
- A tab nav built from a new config map (see below): one `<button>` per tab, label from `labelKey`, plus a `question-circle-fill` icon badge next to the label showing `tooltipKey`'s text (reuse the existing `OverlayTrigger`/`Tooltip` pattern already used elsewhere, e.g. `frontend/assets/js/components/common/cards/CardHoverTooltip.jsx`, rather than inventing a new tooltip mechanism). Add `questionCircleFill: 'bi-question-circle-fill'` to `frontend/assets/js/utils/ui/Icons.js` (mirrors `LinkIcon.jsx`'s existing `bi bi-*` usage) — it isn't defined there yet.
- The active tab's component, passing down whatever it needs (character context, `onClose`, `onSuccess`, and anything currently threaded through `ownedTreasures`/`gameType`).

Add `frontend/assets/js/components/resources/character/pages/elements/treasureExchangeTabs.js`:

```js
export default {
  buy: {
    labelKey: 'treasure_exchange_modal.buy_tab',
    tooltipKey: 'treasure_exchange_modal.buy_tab_tooltip',
    Component: BuyTreasureTab,
  },
  sell: {
    labelKey: 'treasure_exchange_modal.sell_tab',
    tooltipKey: 'treasure_exchange_modal.sell_tab_tooltip',
    Component: SellTreasureTab,
  },
};
```

This is the "configuration in a class/map with buy/sell keys" the issue describes; keep each entry's shape minimal (label, tooltip, component) since that's all the shell needs today.

### Step 2 — Extract shared detail-pane markup

The two-column selected-item view (image, name, value, "already owned", quantity input, `Confirm`/`Cancel` buttons) is nearly identical between Buy and Sell today (see `TreasureExchangeModalHelper.#renderDetail`) and must stay identical in the new design (same UI, plus the new Cancel button). Extract it into a shared presentational helper, e.g. `frontend/assets/js/components/resources/character/pages/elements/tabs/shared/ExchangeDetailPane.jsx`, parameterized by: `selected`, `quantity`, `owned`, `maxQuantity`, `submitting`, `actionError`, `gameType`, and handlers `onQuantityChange`/`onConfirm`/`onCancel`. Both new tab components call this instead of duplicating the JSX.

Move the `Confirm`/`Cancel` button pair to sit together at the bottom (per the issue's solution), and rename/reframe the existing top `Back` link as the new bottom `Cancel` button (same handler behavior — clear `selected`, don't submit — new position/label, key `treasure_exchange_modal.cancel_selection`).

### Step 3 — Split Buy into its own component/controller/helper

Create `frontend/assets/js/components/resources/character/pages/elements/tabs/BuyTreasureTab.jsx` with sibling `controllers/BuyTreasureTabController.js` and `helpers/BuyTreasureTabHelper.jsx`, mirroring the existing Component/Controller/Helper split convention. Move everything from today's controller/helper that's Buy-only:
- `fetchAcquirePage`/`buildBrowseParams`'s acquire branch → `BuyTreasureTabController#fetchPage`, unchanged `RequestStore` usage (`resource: 'treasure'`, `kind: 'game'`).
- `acquire()` → `BuyTreasureTabController#buy`, calling the renamed `characterClient.buyTreasure`/`buyTreasureAll`.
- The Buy-only parts of `resolveDetailValues` (`selected.id`, `ownedByTreasureId` lookup, no `maxQuantity`) and `#renderAvailabilityBadge`.
- Owns its own `browse`/`selected`/`quantity`/`submitting`/`actionError`/`partialNotice`/`search` state (today's modal-level state, now scoped to this tab) — reset it whenever the shell switches away from/into this tab, same as today's `handleTabChange` reset behavior.

### Step 4 — Split Sell into its own component/controller/helper, and give it a safe `RequestStore` path

Create the Sell mirror (`SellTreasureTab.jsx` + controller/helper) the same way, moving `fetchSellPage`, `sell()`, and Sell's `resolveDetailValues` branch (`selected.treasure_id`/`selected.quantity` as both owned and max).

The issue asks for Sell's GET list to go through `RequestStore` too (today it calls `characterClient.fetchTreasuresPage` directly). Routing it straight through `treasureConfig.js`'s existing `treasure`/`collection` resource as-is would change behavior: that config's `private` variant elevates `kind: 'npcs'` to `.../treasures/all.json` whenever the requester `can_edit`, which starts including **hidden** treasures — something the current code deliberately avoids for Sell (only Buy relies on that elevation). To preserve today's behavior while satisfying "go through `RequestStore`":

- Add a distinct resource-config entry for the character's *owned* treasures (e.g. a new `characterTreasure` resource, or a new `collection` key alongside `treasure`'s existing one in `treasureConfig.js` — pick whichever fits the existing `RESOURCES` map convention in `resourceConfig.js` best) whose `private` path/permission resolve to the **same** value as `regular` for every `kind` (i.e. never elevate), mirroring how this same file's `single.private` already just points at `single.regular`.
- Point `SellTreasureTabController#fetchPage` at that new resource/collection key through `RequestStore`, with `kind: 'pcs'|'npcs'`.
- Add/update the relevant `resourceConfigSpec.js`/`treasureConfigSpec.js` coverage for the new entry, asserting `private` never elevates.

### Step 5 — Rename remaining "acquire" references in frontend production code

- `CharacterClient.js`: `acquireTreasure` → `buyTreasure`, `acquireTreasureAll` → `buyTreasureAll` (update JSDoc too).
- `CharacterContextController.js`, `CharacterTreasuresHelper.jsx`, `CharacterTreasures.jsx`, `mergeCharacterTreasureQuantity.js`: update any `acquire`-named identifiers/comments to `buy` (check each doesn't rely on the `acquired`/`acquired_units` data fields, which must stay as-is).
- Delete the old `TreasureExchangeModalController.js`/`TreasureExchangeModalHelper.jsx` once their logic has fully moved into the Buy/Sell tab files and the new shell — don't leave dead code behind.

### Step 6 — Update specs

- Delete/replace the old `TreasureExchangeModalController/{acquireSpec,fetchAcquirePageSpec,fetchSellPageSpec,sellSpec,confirmExchangeSpec,buildBrowseParamsSpec,buildPartialNoticeSpec}.js` and `TreasureExchangeModalHelper/*Spec.js` files with new specs under `BuyTreasureTabController/`, `SellTreasureTabController/`, and each helper's spec folder, following the existing naming/organization convention (one spec file per method/behavior, `support.js` for shared fixtures).
- Add coverage for: the new tab shell's config-driven rendering (label, tooltip badge, correct component per tab), the new `Cancel` button in the detail pane, and the new Sell resource-config entry's non-elevating behavior.
- Rename `acquireTreasureSpec.js`/`acquireTreasureAllSpec.js` (CharacterClient specs) to `buyTreasureSpec.js`/`buyTreasureAllSpec.js`.

## Files to Change

- `frontend/assets/js/components/resources/character/pages/elements/TreasureExchangeModal.jsx` — reduce to shell (tab state + config-driven render).
- `frontend/assets/js/components/resources/character/pages/elements/treasureExchangeTabs.js` — new config map.
- `frontend/assets/js/components/resources/character/pages/elements/tabs/BuyTreasureTab.jsx`, `controllers/BuyTreasureTabController.js`, `helpers/BuyTreasureTabHelper.jsx` — new.
- `frontend/assets/js/components/resources/character/pages/elements/tabs/SellTreasureTab.jsx`, `controllers/SellTreasureTabController.js`, `helpers/SellTreasureTabHelper.jsx` — new.
- `frontend/assets/js/components/resources/character/pages/elements/tabs/shared/ExchangeDetailPane.jsx` — new, shared detail-pane markup incl. the new `Cancel` button.
- `frontend/assets/js/components/resources/character/pages/elements/controllers/TreasureExchangeModalController.js`, `helpers/TreasureExchangeModalHelper.jsx` — delete once migrated.
- `frontend/assets/js/utils/ui/Icons.js` — add `questionCircleFill`.
- `frontend/assets/js/utils/requests/config/treasureConfig.js` (and/or `resourceConfig.js`) — new non-elevating collection entry for Sell.
- `frontend/assets/js/client/CharacterClient.js` — rename `acquireTreasure(All)` → `buyTreasure(All)`.
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterContextController.js`, `.../pages/shared/CharacterTreasuresHelper.jsx`, `.../pages/shared/CharacterTreasures.jsx`, `frontend/assets/js/.../mergeCharacterTreasureQuantity.js` — rename remaining "acquire" identifiers.
- `frontend/specs/.../TreasureExchangeModalSpec.js`, `.../TreasureExchangeModalController/*.js`, `.../TreasureExchangeModalHelper/*.js` — replace with specs for the new shell/tab files.
- `frontend/specs/assets/js/client/CharacterClient/acquireTreasureSpec.js`, `acquireTreasureAllSpec.js` → `buyTreasureSpec.js`, `buyTreasureAllSpec.js`.
- `frontend/specs/assets/js/utils/requests/{resourceConfigSpec.js,treasureConfigSpec.js}` — cover the new Sell collection entry.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`) — Jasmine specs + coverage.
- `frontend`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`) — ESLint.

## Notes

- The new Sell resource-config entry changes which endpoint variant Sell's list resolves to internally; even though no new API endpoint is added, flag this specific change for a `security`/`data-access` look given it's about hidden-treasure visibility.
- Keep the modal's external prop API (`show`, `character`, `ownedTreasures`, `gameType`, `onClose`, `onSuccess`) stable — `CharacterTreasures.jsx` (the consumer) shouldn't need changes beyond whatever "acquire" identifier renames land there.

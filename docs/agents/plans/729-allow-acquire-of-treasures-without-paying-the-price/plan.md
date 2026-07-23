# Plan: Allow acquire of treasures without paying the price

Issue: [729-allow-acquire-of-treasures-without-paying-the-price.md](../issues/729-allow-acquire-of-treasures-without-paying-the-price.md)

## Overview

Add two new tabs, **Acquire** and **Remove**, to `TreasureExchangeModal` alongside the
existing Buy/Sell tabs, letting a character's treasures be granted or taken away without
touching their money. The backend adds `acquire`/`acquire/all`/`remove` endpoints next to
the existing `buy`/`buy/all`/`sell` ones, reusing the same shared locking/value-recalculation
logic and the same `CharacterTreasureExchangePermission` (confirmed consistent with product
intent — see the issue file's discussion). The frontend adds two new tab components mirroring
`BuyTreasureTab`/`SellTreasureTab` almost verbatim (same shared `ExchangeDetailPane`, same
`RequestStore` resource configs, no new ones needed) and registers them in
`treasureExchangeTabs.js`. Four new i18n keys (tab labels + tooltips) are added for both
locales.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)
- [proxy](proxy.md)

## Shared contracts

### New endpoints (backend produces, frontend consumes)

| Method | URL | Notes |
|---|---|---|
| POST | `/games/<slug>/pcs/<id>/treasures/acquire.json` | Same as `buy.json` minus money check/change |
| POST | `/games/<slug>/pcs/<id>/treasures/acquire/all.json` | DM-only, bypasses hidden-treasure gate, mirrors `buy/all.json` |
| POST | `/games/<slug>/pcs/<id>/treasures/remove.json` | Same as `sell.json` minus money change |
| POST | `/games/<slug>/npcs/<id>/treasures/acquire.json` | NPC equivalent |
| POST | `/games/<slug>/npcs/<id>/treasures/acquire/all.json` | NPC equivalent |
| POST | `/games/<slug>/npcs/<id>/treasures/remove.json` | NPC equivalent |

Request body for all six: `{"treasure_id": <int>, "quantity": <int, min 1>}` — identical
shape to buy/sell (`_TreasureExchangeSerializer`).

Response shape, kept identical to buy/sell so the frontend controllers can reuse the exact
same parsing pattern:

- `acquire`/`acquire/all` → `{"quantity": <int>, "money": <int>, "acquired": <int>}` — `money`
  is `character.money` unchanged (still returned, for symmetry with Buy's response and the
  frontend's existing `#parseActionResponse` pattern), `acquired` is the units actually
  granted (may be less than requested if capped by `GameTreasure.available_units`).
- `remove` → `{"quantity": <int>, "money": <int>}` — `money` unchanged, `quantity` is the
  character's new owned quantity of that treasure (same as `sell.json`'s response).

Error responses reuse the exact same shapes/status codes as buy/sell: 401 unauthenticated,
403 forbidden, 404 unknown/hidden/not-owned treasure, 400 `{"errors": {"quantity": [...]}}`
for `not enough owned` (remove) — acquire has no `insufficient funds` case since money is
never checked.

Permission: both reuse `CharacterTreasureExchangePermission` (`backend/games/permissions.py`)
unchanged — same as buy/sell.

### Frontend tab registration (frontend produces/consumes internally)

Two new entries added to `treasureExchangeTabs.js`:

```js
acquire: {
  labelKey: 'treasure_exchange_modal.acquire_tab',
  tooltipKey: 'treasure_exchange_modal.acquire_tab_tooltip',
  Component: AcquireTreasureTab,
},
remove: {
  labelKey: 'treasure_exchange_modal.remove_tab',
  tooltipKey: 'treasure_exchange_modal.remove_tab_tooltip',
  Component: RemoveTreasureTab,
},
```

### Translation keys (translator produces, frontend consumes via `Translator.t()`)

Four new keys under the existing `treasure_exchange_modal:` namespace in both `en.yaml` and
`pt.yaml`: `acquire_tab`, `acquire_tab_tooltip`, `remove_tab`, `remove_tab_tooltip`. No new
error-message keys — Acquire has no failure mode beyond the existing `generic_error`/
`load_error`, and Remove reuses `not_enough_owned` (identical condition to Sell's).

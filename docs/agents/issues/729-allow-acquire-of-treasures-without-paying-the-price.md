# Issue: Allow acquire of treasures without paying the price

## Description
In the character treasures page (`/#/games/:game_slug/pcs/:id/treasures` and the NPC equivalent), the `TreasureExchangeModal` (`frontend/assets/js/components/resources/character/pages/elements/TreasureExchangeModal.jsx`) lets a player/DM exchange a character's treasures for money and vice versa, through a config-driven set of tabs (`frontend/assets/js/components/resources/character/pages/elements/treasureExchangeTabs.js`):

- **Buy tab** (`tabs/BuyTreasureTab.jsx`) — lists `GameTreasure`s affordable within the character's money, and calls `POST .../treasures/buy.json`.
- **Sell tab** (`tabs/SellTreasureTab.jsx`) — lists owned `CharacterTreasure`s, and calls `POST .../treasures/sell.json`.

Both actions change the character's money (Buy spends it, Sell refunds it) — see the shared backend implementation in `backend/games/views/game/_treasure_exchange.py`.

## Problem
Buy and Sell only support exchanging treasure for money and vice versa (meant for converting money into treasure, or back, to simplify bookkeeping after a game). There is no way to give a character treasure, or take treasure away, without an equal money exchange — e.g. a treasure gained or lost during a game for narrative reasons, with no corresponding money change.

## Expected Behavior
- Two new tabs, **Acquire** and **Remove**, appear in `TreasureExchangeModal` alongside Buy/Sell, on both the PC and NPC treasures pages.
- Using Acquire adds treasure to the character without changing their money; using Remove removes treasure from the character without changing their money.
- `CharacterTreasure.total_value`/`Character.treasure_value` stay correctly recalculated after either action, same as Buy/Sell.

## Solution
Add two new tabs, **Acquire** and **Remove**, alongside the existing Buy/Sell tabs, to change a character's treasures without touching their money.

### Acquire tab
Mirrors the Buy tab, with these differences:
- Lists all `GameTreasure`s in the game's catalog, not filtered by the character's money (no `max_value` query param).
- Submits to a new endpoint: `POST /games/:game_slug/pcs/:id/treasures/acquire.json` (+ NPC equivalent).
- Help tooltip: "Acquires treasure without changing character's money".

Also gets a DM-only `.../treasures/acquire/all.json` variant, mirroring `.../buy/all.json` — bypasses the hidden-treasure gate so a DM can grant a hidden treasure on a character's behalf.

### Remove tab
Mirrors the Sell tab, with this difference:
- Submits to a new endpoint: `POST /games/:game_slug/pcs/:id/treasures/remove.json` (+ NPC equivalent).
- Help tooltip: "Removes treasure without changing character's money".

### New tabs config
Registered in `treasureExchangeTabs.js` alongside `buy`/`sell`, each with its own `Component`/Controller/Helper trio (mirroring `BuyTreasureTab`/`SellTreasureTab`'s structure under `tabs/`).

### New backend endpoints
Both live alongside the existing `character_treasure_buy`/`character_treasure_sell` in `backend/games/views/game/_treasure_exchange.py`, reusing the same `_TreasureExchangeSerializer` payload (`treasure_id`, `quantity`) and `CharacterTreasureExchangePermission`.

- **`POST /games/:game_slug/pcs/:id/treasures/acquire.json`** (+ NPC equivalent, + DM-only `.../acquire/all.json`) — same as Buy, except it never checks or changes `character.money`.
- **`POST /games/:game_slug/pcs/:id/treasures/remove.json`** (+ NPC equivalent) — same as Sell, except it never changes `character.money`.

Both still recalculate `CharacterTreasure.total_value` (via `resolve_treasure_value`) and keep the same stock-cap / `GameTreasure.acquired_units` bookkeeping that Buy/Sell already do — Acquire stays capped at `GameTreasure.available_units` exactly like Buy, it just doesn't reject on insufficient funds.

### Routing
New routes added to `backend/games/urls/_character_routes.py`'s `_CHARACTER_ROUTES`, following the `treasure_buy`/`treasure_buy_all`/`treasure_sell` pattern, resolved to `game_{kind}_treasure_acquire`/`game_{kind}_treasure_acquire_all`/`game_{kind}_treasure_remove` view functions (one thin wrapper per PC/NPC kind, mirroring `game_pc_treasure_buy.py`/`game_pc_treasure_buy_all.py` — no `remove/all.json`, mirroring Sell having no DM-bypass variant either).

## Permissions
### Frontend
The Acquire/Remove tabs are visible under the same conditions as Buy/Sell.

### Backend
The new endpoints use `CharacterTreasureExchangePermission`, the same permission class already used by buy/sell.

## Benefits
Lets treasure be granted to, or taken from, a character to reflect in-game events, without being forced through an artificial money exchange.

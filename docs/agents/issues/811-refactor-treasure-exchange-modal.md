# Issue: Refactor treasure exchange modal

## Description
`TreasureExchangeModal` (`frontend/assets/js/components/resources/character/pages/elements/TreasureExchangeModal.jsx`, with its controller and helper siblings in the same folder) is the modal a PC/NPC uses to exchange treasures on `/#/games/:game_slug/pcs/:id/treasures` and `/#/games/:game_slug/npcs/:id/treasures`.

It has two tabs:

- **Acquire tab** — lists `GameTreasure` available for purchase. Clicking an entry switches to a two-column detail view (list on the left, treasure info + owned quantity on the right), with a quantity input and a `Confirm` button that calls the acquire endpoint.
- **Sell tab** — lists `CharacterTreasure` currently owned. Clicking an entry shows the same two-column detail view, with a quantity input bounded by `1..quantity` and a `Confirm` button that calls the sell endpoint.

Endpoints involved:

- `POST /games/:game_slug/pcs/:id/treasures/acquire.json` and the NPC equivalent — increases `CharacterTreasure.quantity` and `GameTreasure.acquired_units`, increases `Character.treasure_value`, decreases `Character.money`.
- `POST /games/:game_slug/pcs/:id/treasures/sell.json` and the NPC equivalent — the inverse of the above.
- `GET /games/:game_slug/treasures.json` — lists available treasures, filterable by `max_value` and `ordering`.

Today the acquire-tab list already goes through `RequestStore`/`treasureConfig.js` (migrated under a prior issue); the sell-tab list and both buy/sell POSTs still call `CharacterClient` methods directly.

## Problem

1. **"Acquire" is the wrong word.** The PC/NPC pays money for the treasure, so the action is a purchase — it should be called "Buy" everywhere it's user-facing (tab label, and ideally the endpoint path/name), not "Acquire".
2. **Tabs and their behavior are hardcoded**, not composed. `TreasureExchangeModalHelper` renders exactly two fixed tabs (`'acquire'`/`'sell'`), and the controller/helper branch on `activeTab === 'acquire'` throughout. There's no per-tab component registry, so the modal can't be reused for other resource types or other action pairs (e.g. add/remove without payment) without duplicating the whole component.
3. **No dedicated "return to listing" action next to Confirm in the two-column detail view.** The modal already has a `Cancel` button in the footer (closes the whole modal) and a `Back` link in the detail view (returns to the list without submitting), but there's no button placed alongside `Confirm`, in the resource-scoped detail view itself, that's explicitly framed as "Cancel this action, go back to the list."

## Expected Behavior

- The modal's tabs read **Buy** / **Sell** (no more "Acquire").
- The buy endpoints are renamed from `.../treasures/acquire.json` (and `.../acquire/all.json`) to `.../treasures/buy.json` (and `.../buy/all.json`), with no change in business logic.
- The modal is built by composing independent components (starting with Buy and Sell) rather than one component branching on tab name, so future resource types/actions (e.g. an Items modal with add/remove, no payment) can reuse the same shell.
- Each tab config declares its label, a help tooltip (shown via a `question-circle-fill` bootstrap-icon badge next to the tab label), and which component renders when the tab is active.
- In the two-column detail view, alongside the existing `Confirm` button there is a `Cancel` button that returns to the listing (staying on the same tab, not closing the modal).
- The GET list requests continue to go through `RequestStore`, for both Buy and Sell tabs (currently only Buy's list is migrated).

## Solution

### Components
Split Buy and Sell into their own components instead of one component branching on `activeTab`. This is a new composition pattern for this codebase area — no existing modal here already does per-tab component composition.

- **Resource** — each component is configured with a resource type (for now `treasure`, using `frontend/assets/js/utils/requests/config/treasureConfig.js`) to resolve requests through `RequestStore`.
- **Character type** — each component also receives the character kind (`pc`/`npc`), used together with the resource to resolve `RequestStore` requests.
- **Game/character context** — the component needs game slug and character id, and can use `RequestStore` to (re)fetch character information after any operation.

### Composition of the modal
The modal is initialized with a list of tab components (`buy`, `sell` for now). Composition is driven by a config map keyed by tab (`buy`/`sell`, more later), each entry declaring:

- the tab label text
- the tab's help-tooltip text (shown via a bootstrap `question-circle-fill` icon badge on the tab)
- the component to render when that tab is active

Config entries can live in separate files and be included into the map, so adding a new tab/resource doesn't require touching the shell itself. This issue is scoped to treasure Buy/Sell only — it doesn't touch the Items page. The Items page (future add/remove modal) is out of scope here; the shell's config-driven design should just be generic enough that a later issue can plug in a different tab set without reworking the shell itself.

### Buy component
- Requests the list of available treasures (character kind + resource, with `max_value`/`ordering` filters) through `RequestStore`.
- Submits the buy request.
- Help tooltip: "Buys treasure using the character's money".

### Sell component
- Requests the list of owned character treasures (character kind + resource) through `RequestStore`.
- Submits the sell request.
- Help tooltip: "Sells treasure recovering the character's money".

### UI and usability
Both components share the same UI shape:

- **Listing** — shows only the filtered list (game treasures for Buy, character treasures for Sell).
- **Entry selected** — splits into two columns (50/50): list stays visible on the left, treasure detail on the right (same as today, but the list stays visible instead of being replaced). Below: the existing `Confirm` button (scoped to the resource type), plus a new `Cancel` button that returns to the listing-only view.
- **Tab** — same as today, plus a `question-circle-fill` icon badge on the left of the tab label showing the help tooltip.

### Endpoint rename
`.../treasures/acquire.json` (and `.../acquire/all.json`) become `.../treasures/buy.json` (and `.../buy/all.json`), for both PC and NPC routes. No change in logic. The rename is full, not just the URL: it covers the URL path/route name in `backend/games/urls/_character_routes.py`, the view module files/functions currently named `*_treasure_acquire*` (`backend/games/views/game/_character_shared.py`, `backend/games/views/game/_treasure_exchange.py`, the per-kind view modules under `backend/games/views/game/{pcs,npcs}/detail/treasures/`, e.g. `game_pc_treasure_acquire.py` → `game_pc_treasure_buy.py`), the frontend `CharacterClient` methods (`acquireTreasure(All)` → `buyTreasure(All)`), and all associated backend/frontend test files/specs currently named with "acquire" (e.g. `game_pc_treasure_acquire_test.py`, `acquireTreasureSpec.js`). The `CharacterTreasureExchangePermission` and `_TreasureExchangeSerializer` are already named generically and don't need renaming.

`GameTreasure.acquired_units` and the `acquired` response field are a separate data-model concept (units consumed from a capped stock, not the purchase action) and are explicitly **out of scope** for this rename — they stay as `acquired_units`/`acquired`.

### GET requests
Both Buy's and Sell's list GET requests go through `RequestStore`/`treasureConfig.js` (today only Buy's is migrated). The buy/sell POST submissions are **not** routed through `RequestStore` — `RequestStore`/`resourceConfig` only support GET today, so extending it to POST is out of scope here. The submissions keep calling `CharacterClient` directly, with `acquireTreasure(All)` renamed to `buyTreasure(All)`.

### Permissions
No changes in permission.

### Cache
In `proxy/extension/lib/configuration/cache_cleanup/treasures.php`, the `acquire` route is replaced by `buy`.

## Benefits
- The modal shell becomes reusable for other resources/actions (e.g. an Items modal with add/remove), instead of being hardcoded to treasure buy/sell.
- Naming ("Buy" instead of "Acquire") matches what the action actually does, reducing user and developer confusion.
- Users get a clear way to back out of a selected entry without closing the whole modal.
- Both tabs' list requests go through the same `RequestStore` path, removing the inconsistency between Buy (migrated) and Sell (not migrated).

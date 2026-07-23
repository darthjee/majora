# Plan: Refactor treasure exchange modal

Issue: [811-refactor-treasure-exchange-modal.md](../../issues/811-refactor-treasure-exchange-modal.md)

## Overview

Split `TreasureExchangeModal` into a generic tab shell plus two independent tab components (Buy, Sell), each with its own controller/helper, driven by a config map (label, help-tooltip, component). Rename "acquire" to "buy" end-to-end (URL, backend view files/functions/tests, frontend client methods, i18n), except the `acquired_units`/`acquired` data-model naming, which stays as-is. Add a `Cancel` button next to `Confirm` in the two-column detail view. Route both tabs' GET list requests through `RequestStore`, introducing a new resource-config shape for Sell so it can go through `RequestStore` without picking up the hidden-treasure-inclusive `all.json` variant Buy uses for editors (the current, deliberate reason Sell isn't migrated yet).

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)
- [proxy](proxy.md)

## Shared contracts

- **Renamed endpoints** (backend → frontend): `POST /games/:game_slug/{pcs,npcs}/:id/treasures/buy.json` and `POST /games/:game_slug/{pcs,npcs}/:id/treasures/buy/all.json` replace the `acquire`/`acquire/all` paths. Route names become `game-{pc,npc}-treasure-buy` / `game-{pc,npc}-treasure-buy-all`. `sell.json` is unchanged. Response shapes are **unchanged**: buy → `{quantity, money, acquired}`, sell → `{quantity, money}`, validation error → `{errors: {quantity: [...]}}`. The `acquired` field name and `GameTreasure.acquired_units` are explicitly kept as-is (data-model concept, not the action name).
- **Frontend client methods** (frontend, consuming backend's rename): `CharacterClient.acquireTreasure`/`acquireTreasureAll` become `buyTreasure`/`buyTreasureAll`, calling the renamed paths above. `TreasureExchangeModalController#acquire` becomes `#buy` (or moves into the new Buy tab's own controller — see [frontend.md](frontend.md)).
- **New Sell resource-config shape** (frontend-internal, but worth calling out): today's `treasureConfig.js` `collection.private` for `kind: 'npcs'` elevates to `.../treasures/all.json` (includes hidden treasures) whenever the requester `can_edit`. Buy relies on exactly that elevation. Sell must **not** get this elevation — it needs a collection variant whose `private` resolves to the same path as `regular` (no elevation), so routing Sell through `RequestStore` doesn't silently start including hidden treasures for a DM viewing an NPC's sell list. See [frontend.md](frontend.md) for how to add this without breaking Buy.
- **i18n keys** (translator → frontend): frontend calls `Translator.t('treasure_exchange_modal.buy_tab')`, `.buy_tab_tooltip`, `.sell_tab_tooltip`, and `.cancel_selection` (renamed from `.back`) by these exact names. See [translator.md](translator.md) for the full key list and copy.
- **Proxy cache route** (backend → proxy): the cache-cleanup route list must match the renamed NPC path `.../treasures/buy.json` (mirroring today's NPC-only coverage in that file — see [proxy.md](proxy.md)).

## Notes

- No new endpoints, serializer fields, or permission changes are introduced by this issue (pure rename + internal composition), so `data-access`/`security`/`product-owner` review is not expected to find scope here — except the new Sell resource-config shape above, which is visibility-sensitive (hidden treasures) even though it's not a new endpoint. Worth a quick `security`/`data-access` look at that one specific config addition during review.
- The Items page (a future consumer of this modal shell for add/remove) is explicitly out of scope for this issue.

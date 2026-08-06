# Issue: Add give treasures

## Description

Add a "Give Treasure" flow, parallel to the existing "give item" flow at
`/#/games/:game_slug/items/:id`: a modal that lets a DM push treasure directly onto one or more
characters (PCs/NPCs), reusing as much of the give-item architecture as fits.

Treasure differs from items in two ways that shape the design:

- `CharacterTreasure` already carries a `quantity` field, so giving treasure can be a single
  `{ quantity }` request per character, instead of the N discrete acquire calls items need (items
  have no quantity — each unit is its own `CharacterItem` row).
- `GameTreasure` already has a maximum-availability concept (`max_units`/`acquired_units`/
  `available_units`), so the total given across all recipients in one action cannot exceed what's
  still available.

## Problem

There is no way for a DM to grant a specific treasure to a character (or several at once) directly
from that treasure's own context. Today, treasure only moves onto a character through the
character-side exchange tabs (`AcquireTreasureTab`/`BuyTreasureTab`), one character at a time,
starting from the *character's* page rather than the *treasure's* page — the same gap items had
before `GiveItemModal` (issue #827) was added.

Additionally, treasure has no game-scoped single-treasure detail page at all today (only a
game-scoped index, `GameTreasures.jsx`, and a *global*, non-game-scoped detail page, `Treasure.jsx`
at `/#/treasures/:id`) — so there's no obvious landing spot yet for a "Give" action mirroring
`GameItem.jsx`'s.

## Expected Behavior

A DM navigates to a game-scoped treasure detail page, clicks "Give," and gets a two-pane modal
(mirroring `GiveItemModal`): search/browse PCs and NPCs on the left, add characters to a
"receiving" list on the right. Each receiving row shows how much of this treasure the character
already owns, and a +/- stepper for how much to give them.

The modal enforces the treasure's available-units cap live: as the DM raises any row's stepper,
the running total across all pending rows cannot exceed what's currently available (when the
treasure has no cap, there's no ceiling). On submit, one request per character is fired with that
character's chosen quantity; each character's `CharacterTreasure.quantity` increases accordingly,
and the treasure's `acquired_units` is updated. If the pool changed between opening the modal and
submitting (e.g. someone else bought/acquired the same treasure concurrently), any request that
gets server-side truncated is surfaced back to the DM after submit.

## Solution

### Entry point

Build a new `GameTreasure.jsx` page at `/#/games/:game_slug/treasures/:id`, mirroring
`GameItem.jsx` (issue #724/#782/#841 lineage) — its own controller (loading a single
`GameTreasure`, picking the public vs. elevated `all.json` endpoint the same way
`GameItemController` does), its own detail helper, an edit button gated on `canEdit`, and the new
"Give" button opening the give-treasure modal. This is the natural landing spot for the "Give"
action, kept separate from the existing global `Treasure.jsx` page rather than retrofitting that
page to be game-aware.

### Quantity request shape

No new backend endpoint is needed for the acquire itself. `character_treasure_acquire` (backing
`POST games/:game_slug/:kind/:id/treasures/acquire.json` and its DM-only `/acquire/all.json`
sibling) already does exactly what "give" needs: validates `{ treasure_id, quantity }`, locks the
character and `game_treasure` rows in a transaction, caps `quantity` to `available_units` when a
cap exists, and persists the increment to both `CharacterTreasure.quantity` and
`game_treasure.acquired_units`.

Unlike `GiveItemModal` (which fires one `acquire` call per unit, since `CharacterItem` has no
quantity field), the give-treasure modal fires **one `acquire` call per selected character**, body
`{ treasure_id, quantity: pendingQuantity }`, reusing the existing `treasure.acquire`/`acquireAll`
frontend resourceConfig entries as-is.

Row-level locking inside `_acquire()` already serializes concurrent requests against the same
`game_treasure`, so submitting to several characters at once (still best-effort parallel, same
pattern as `GiveItemModalController.submit`) can't double-spend the shared pool — each request
re-reads and re-caps under lock, even though which character "wins" a partially-available pool
isn't guaranteed by request-resolution order.

### Max-availability capping UX

Unlike the existing single-character `AcquireTreasureTab` (which browses treasures and commits one
at a time, showing an `available_units` badge and a post-submit `partialNotice` alert when the
server truncates), the give-treasure modal has the treasure fixed up front (we're on its detail
page) and builds a multi-recipient list before submitting — so the pool has to be tracked across
several pending rows, not just one.

Track the pool **client-side, live**, while the DM composes the receiving list. Show
`available_units` once at the top of the modal; as each row's +/- stepper changes, compute
`remaining = available_units - sum(pending quantities across all rows)` and refuse to let any
stepper push the running total past that ceiling (mirrors the existing badge concept, but applied
across the whole batch instead of one treasure at a time). When `available_units` is `null`
(unlimited), no cap applies, matching today's badge-suppression behavior.

This makes over-allocation structurally impossible from the UI, and sidesteps the fact that the
backend still caps each recipient's request independently and in whatever order the parallel
`Promise.all` calls resolve — without a client-side cap, a DM-intended split (e.g. "3 to Alice, 2
to Bob") isn't guaranteed if it exceeds the pool, since whichever request resolves first
server-side gets its full amount regardless of the DM's intended allocation. The existing
`partialNotice`-style alert is still reused post-submit, to cover the residual race where the pool
shrinks between modal open and submit (e.g. another concurrent buy/acquire against the same
treasure).

### Owned-quantity summary lookup

`GiveItemModal` fetches "how many does this character already own" once per character added to the
receiving list, via a dedicated `item.summary` endpoint (`GET
.../items/:itemId/:kind/:id/summary.json` → `{ quantity }`) — a fast single-value lookup, not a
full list fetch.

Treasure's existing per-character listing (`character_treasures`, backing
`games/:game_slug/:kind/:id/treasures.json`) is the wrong shape for this: it's a paginated,
filterable list meant for browsing a character's whole treasure collection, not a quick per-row
lookup during modal composition.

Add a new `treasure.summary` endpoint mirroring item's — `GET
.../treasures/:treasureId/:kind/:id/summary.json` → `{ quantity }` — resolving even more simply
than item's `character_item_summary` (which does a `.count()` over discrete `CharacterItem` rows),
since `CharacterTreasure.quantity` is already a stored integer field: just fetch the character's
`CharacterTreasure` row for that treasure (defaulting to `0` when none exists) and return its
`quantity`.

### Reuse

Reuse the give-item structural template directly: `TwoColumnLayout`, `BrowsePager`, the PC/NPC
tab+search+browse pattern, and the receiving-list shape (`GiveItemModal.jsx` /
`GiveItemModalController.js` / `GiveItemModalHelper.jsx` / `ReceivingRowHelper.jsx` become
`GiveTreasureModal.jsx` / `GiveTreasureModalController.js` / `GiveTreasureModalHelper.jsx` / an
analogous receiving-row helper), adapted for the quantity-per-request and pool-capping differences
above.

## Benefits

- Gives DMs a direct, treasure-first way to grant loot to one or more characters at once, matching
  the workflow already available for items.
- Heavily reuses existing, already-battle-tested pieces: the give-item modal's structural pattern,
  the treasure exchange endpoints' quantity/locking/capping logic, and the availability-badge UX
  precedent from `AcquireTreasureTab` — minimizing net-new surface area.
- Preserves the integrity of `GameTreasure.available_units` under concurrent, multi-recipient
  submission, both via server-side row locking and a client-side cap that keeps the DM's intended
  allocation from silently exceeding the pool.

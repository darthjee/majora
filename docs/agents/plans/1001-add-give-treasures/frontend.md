# Frontend Plan: Add give treasures

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the new `GET .../treasures/:treasure_id/pcs|npcs/:id/summary[/all].json` → `{ quantity }`
endpoints backend produces (see [plan.md](plan.md)), and the unchanged `treasure.single`
(`available_units`/`max_units` already present) and `treasure.acquire`/`acquireAll` (`{ quantity,
acquired }` response) endpoints. Consumes the new `give_treasure_modal.*` i18n keys translator
produces.

## Implementation Steps

### Step 1 — `treasureConfig.js`: add the `GET.summary` entry

Mirror `itemConfig.js`'s `summary`/`summaryAll` path builders and `GET.summary` block exactly,
adjusted for treasure's param name (`treasureId` instead of `itemId`) and path shape
(`/games/:gameSlug/treasures/:treasureId/:kind/:id/summary.json`,
`.../summary/all.json`):

```js
const summaryPath = ({ gameSlug, treasureId, kind, id }) =>
  `/games/${gameSlug}/treasures/${treasureId}/${kind}/${id}/summary.json`;
const summaryAllPath = ({ gameSlug, treasureId, kind, id }) =>
  `/games/${gameSlug}/treasures/${treasureId}/${kind}/${id}/summary/all.json`;
// ...
GET: {
  // ...existing collection/single/ownedCollection...
  summary: {
    regular: { path: summaryPath, permission: null, skipCache: true },
    private: { path: summaryAllPath, permission: 'can_edit', skipCache: true },
  },
},
```

### Step 2 — New `GameTreasure.jsx` page + controller + helper

Add `frontend/assets/js/components/resources/treasure/pages/GameTreasure.jsx`,
`.../controllers/GameTreasureController.js`, `.../helpers/GameTreasureHelper.jsx`.

`GameTreasureController` is simpler than `GameItemController`: `treasure.single`'s `regular`/
`private` variants already point at the *same* endpoint (no elevated `all.json` fetch to choose
between — confirmed in `treasureConfig.js`'s own doc comment), so there's no permission-gated
fetch branch to build. Instead, mirror `TreasureController.js`'s own pattern: fetch via
`RequestStore.ensure({ resource: 'treasure', quantityType: 'single', params: { gameSlug, id:
treasureId } })`, then merge `can_edit` in from `AccessStore.ensureTreasurePermissions(treasureId,
true)` / `AccessStore.getTreasurePermissions(treasureId)` (the `isGameScoped=true` form), the same
optimistic-render-then-refresh two-step `TreasureController#renderTreasure` already does. Route
param extraction: `/games/:game_slug/treasures/:treasure_id` (use `treasure_id`, matching
`GameTreasureEditController`'s own naming, not item's `:id`).

`GameTreasureHelper` mirrors `TreasureHelper.jsx`'s manual (non-`ShowPageLayout`) rendering style
— header with name + edit link (gated on `can_edit`, reusing `treasure_page.edit`) — plus a new
unconditional "Give Treasure" button (no permission gate, same rationale as `ItemDetailHelper`'s
Give Item button: per-character grants are checked server-side), opening `GiveTreasureModal`.
Also render `available_units`/`max_units` next to the value line when not `null` (reuses
`treasure_exchange_modal.available_units_badge` wording).

### Step 3 — Route registration

In `frontend/assets/js/utils/routing/HashRouteResolver.js`, insert
`['/games/:game_slug/treasures/:treasure_id', 'gameTreasure']` right after the
`gameTreasureEdit` entry and before the bare `gameTreasures` list entry (matches item's own
new → edit → single → list ordering). In `frontend/assets/js/components/helpers/AppHelper.jsx`,
import `GameTreasure` and add `gameTreasure: <GameTreasure />,` alongside the other
`gameTreasure*` entries.

### Step 4 — `GiveTreasureModal` + controller + helper + receiving-row helper

Add under `frontend/assets/js/components/resources/treasure/pages/elements/`:
`GiveTreasureModal.jsx`, `controllers/GiveTreasureModalController.js`,
`helpers/GiveTreasureModalHelper.jsx`, `helpers/TreasureReceivingRowHelper.jsx` — structurally
copy `GiveItemModal.jsx`/`GiveItemModalController.js`/`GiveItemModalHelper.jsx`/
`ReceivingRowHelper.jsx` (`frontend/assets/js/components/resources/item/pages/elements/`), reusing
`TwoColumnLayout`, `BrowsePager`, and the PC/NPC tab+search+browse pattern as-is. Differences from
the item version:

- Props: `treasure` (`{ id, hidden, available_units }`) instead of `item`. `available_units` seeds
  the live pool cap (`null` → unlimited, no cap).
- Per-character summary fetch uses `treasure.summary`/`summaryAll` (Step 1) instead of
  `item.summary`.
- Each receiving row carries a single `pendingQuantity` (already true for items too) but the
  +/- stepper's increment handler must additionally refuse to increase `pendingQuantity` once
  `sum(pendingQuantity across all rows) === available_units` (skip the check when `available_units`
  is `null`). Surface the live `remaining = available_units - sum(pending)` value in the modal
  header via the new `give_treasure_modal.remaining_units` key.
- Submit fires **one** `POST .../treasures/acquire.json` (or `.../acquire/all.json` when `canEdit`)
  per receiving row, body `{ treasure_id: treasure.id, quantity: row.pendingQuantity }` — not one
  call per unit like `GiveItemModalController.submit`. After each call resolves, compare the
  response's `acquired` field against the row's requested `pendingQuantity`; if less, surface a
  `give_treasure_modal.partially_fulfilled`-keyed notice for that row (reusing
  `treasure_exchange_modal.partially_fulfilled`'s wording/interpolation shape). Then re-fetch that
  character's summary regardless of outcome, mirroring `GiveItemModalController.submit`'s own
  unconditional post-submit refresh.

### Step 5 — Specs

Add Jasmine specs for every new file in Steps 1-4, mirroring the existing coverage shape for
`itemConfig.spec.js`'s `summary` entries, `GameItem.spec.jsx`/`GameItemController.spec.js`, and
`GiveItemModal.spec.jsx`/`GiveItemModalController.spec.js`/`GiveItemModalHelper.spec.jsx` (find
via `find frontend/assets/specs -iname "*GiveItemModal*" -o -iname "*GameItem*"`). Cover
specifically: the live pool-cap refusing to over-increment, the one-call-per-character submit
shape, and the partial-fulfillment notice.

## Files to Change

- `frontend/assets/js/utils/requests/config/treasureConfig.js` — add `GET.summary`
- `frontend/assets/js/components/resources/treasure/pages/GameTreasure.jsx` — new
- `frontend/assets/js/components/resources/treasure/pages/controllers/GameTreasureController.js` — new
- `frontend/assets/js/components/resources/treasure/pages/helpers/GameTreasureHelper.jsx` — new
- `frontend/assets/js/utils/routing/HashRouteResolver.js` — new route entry
- `frontend/assets/js/components/helpers/AppHelper.jsx` — new route component mapping
- `frontend/assets/js/components/resources/treasure/pages/elements/GiveTreasureModal.jsx` — new
- `.../elements/controllers/GiveTreasureModalController.js` — new
- `.../elements/helpers/GiveTreasureModalHelper.jsx` — new
- `.../elements/helpers/TreasureReceivingRowHelper.jsx` — new
- Matching spec files under `frontend/assets/specs/` for every file above

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- Confirm `AccessStore.ensureTreasurePermissions`'s exact signature/cache-key behavior before
  wiring `GameTreasureController` — `TreasureController.js` calls it as
  `ensureTreasurePermissions(id, Boolean(treasure.game_slug))`; for the game-scoped page the second
  argument should always resolve `true` given the route is inherently game-scoped, but confirm
  against `AccessStore`'s implementation rather than assuming.
- Double-check whether `GameTreasureHelper` should also gate/offer a photo-upload affordance like
  `GameItem.jsx` does — out of scope per the issue (only "Give" was asked for), skip unless it's
  trivial to include consistently.

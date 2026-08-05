# Frontend Plan: Add give item option

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the four summary endpoints and the (behaviorally relaxed but shape-unchanged) acquire
endpoint from `plan.md`'s "Shared contracts". Defines the exact `give_item_modal` i18n key names
the translator agent must add (see "Files to Change" below) — the translator agent copies these
key names verbatim into both locale files with the appropriate English/Portuguese text.

## Implementation Steps

### Step 1 — Shared two-column layout component

Extract a new shared component (e.g.
`frontend/assets/js/components/common/layout/TwoColumnLayoutHelper.jsx`, matching the
project's Component/Helper split convention) taking `browsePane`/`detailPane` props: renders
`browsePane` alone (single column) when `detailPane` is `null`/absent, otherwise wraps both in the
existing `row`/`col-6` Bootstrap layout (the pattern currently duplicated across
`tabs/helpers/BuyTreasureTabHelper.jsx:36-61`, `tabs/helpers/AcquireItemTabHelper.jsx:37-50`, and
6 other tab helpers — none of those 8 are touched by this issue; only the new modal below consumes
this component, per [#988](https://github.com/darthjee/majora/issues/988) for the retrofit).

### Step 2 — Register the new request config entries

In `frontend/assets/js/utils/requests/config/itemConfig.js`, add a `GET.summary` entry alongside
the existing `acquire` entry (`itemConfig.js:214-215,278-280`):

```js
const summaryPath = ({ gameSlug, itemId, kind, id }) => `/games/${gameSlug}/items/${itemId}/${kind}/${id}/summary.json`;
const summaryAllPath = ({ gameSlug, itemId, kind, id }) => `/games/${gameSlug}/items/${itemId}/${kind}/${id}/summary/all.json`;
// ...
summary: {
  regular: { path: summaryPath, permission: null, skipCache: true },
  private: {
    path: summaryAllPath,
    permission: (params) => (params.kind === 'npcs' ? 'can_edit' : null),
    skipCache: true,
  },
},
```

The pc `private` variant resolving to `permission: null` (rather than `'can_edit'`) mirrors
`treasureConfig.js`'s existing `kind === 'npcs' ? 'can_edit' : null` pattern
(`treasureConfig.js:227`) for the dm/admin-or-owner tier — confirm against how `RequestClient`
resolves a `null` permission for the `private` variant specifically for pcs (it must still require
*some* authenticated access, just not `can_edit`); if the existing pattern doesn't already cover
"owner can call `private` too", flag this as a gap for the backend/data-access review rather than
guessing at new client-side logic.

### Step 3 — Give-item modal component

New files under `frontend/assets/js/components/resources/item/pages/elements/` (new `elements`
folder, mirroring the character page's `pages/elements/` convention):

- `GiveItemModal.jsx` / `helpers/GiveItemModalHelper.jsx` — modal shell (Component/Helper split,
  matching `ResourceExchangeModal.jsx`/`ResourceExchangeModalHelper.jsx`).
- `controllers/GiveItemModalController.js` — owns:
  - PC/NPC tab state + server-side search (debounced `name` query param via the existing
    `GET.collection` pc/npc list endpoints — no new backend work, per the issue's "Search"
    section).
  - The right-side "receiving" list: `{ character, ownedQuantity, pendingQuantity }[]`. Adding a
    character (from the left list) calls `GET .../summary.json` once for that character via the
    new `summary` config entry, seeds `pendingQuantity = 1`; re-adding an already-listed character
    increments `pendingQuantity` instead of duplicating the row.
  - Increment/decrement handlers (floor at 1) and remove-row handler (empties back to single
    column, per Step 1, when the list becomes empty).
  - Submit: fires `pendingQuantity` sequential/parallel `POST .../items/acquire.json` calls per
    listed character (best-effort — do not abort remaining requests on one failure), tallies
    per-character success/failure, then re-fetches that character's `summary.json` regardless of
    outcome to refresh `ownedQuantity` from actual server state.
  - Mid-submit lock: a `submitting` flag disabling cancel/clear/close, cleared only once every
    in-flight request (both acquire calls and the follow-up summary refetches) has settled.
- `helpers/*RowHelper.jsx` for a single right-side row: quantity display + `bi-caret-up-square-fill`
  / `bi-caret-down-square-fill` (increment/decrement) and `bi-person-x` (remove), each wrapped in
  `OverlayTrigger`/`Tooltip` (matching `ResourceExchangeModalHelper.jsx`'s existing tooltip usage),
  plus tooltips on the two numeric displays (owned / pending).

Use the Step 1 layout component: `browsePane` = pc/npc tabs + search + list, `detailPane` = the
right-side receiving list (absent until the first character is picked).

### Step 4 — Wire the button into the item detail page

In `frontend/assets/js/components/resources/item/pages/helpers/ItemDetailHelper.jsx`, add an
"Add Item" button (visible unconditionally — no permission prop gate, matching the issue's
"Button visibility" decision) that opens the Step 3 modal, following the same
`show`/`onClose`/`onSuccess` prop wiring `GameItem.jsx` already uses for `PhotoUploadModal`
(`GameItem.jsx:29,62-67`). On modal success/close, no forced page refetch is required by itself
(the modal's own per-character summary refetches already reflect server state within the modal);
only refetch the page's own item data if it displays anything summary-derived (it currently
doesn't).

## Files to Change

- `frontend/assets/js/components/common/layout/TwoColumnLayoutHelper.jsx` (+ `TwoColumnLayout.jsx`
  if a Component/Helper split is warranted here) — new shared layout component.
- `frontend/assets/js/utils/requests/config/itemConfig.js` — new `GET.summary` entry.
- `frontend/assets/js/components/resources/item/pages/elements/GiveItemModal.jsx`,
  `helpers/GiveItemModalHelper.jsx`, `controllers/GiveItemModalController.js`, row helper(s) — new
  modal.
- `frontend/assets/js/components/resources/item/pages/GameItem.jsx` /
  `helpers/ItemDetailHelper.jsx` — new "Add Item" button + modal wiring.
- `frontend/assets/i18n/en.yaml` / `pt.yaml` — new `give_item_modal` namespace (translator agent
  fills in; frontend agent defines the exact keys it reads via `Translator.t(...)`), at minimum:
  `title`, `pc_tab`, `npc_tab`, `search_placeholder`, `cancel`, `clear`, `submit`,
  `owned_quantity_tooltip`, `pending_quantity_tooltip`, `increment_tooltip`, `decrement_tooltip`,
  `remove_character_tooltip`, `loading`, `load_error`, and a per-character result summary message
  (success/failure), mirroring the naming style of the existing `item_exchange_modal` namespace
  (`frontend/assets/i18n/en.yaml:423-438`).
- Specs (mirrored tree under `frontend/specs/assets/js/components/...` and
  `frontend/specs/assets/js/utils/requests/config/`) for every new/changed file above.

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`) — new/changed specs.
- `frontend`: `npm run lint` (CI job: `frontend-checks`) — ESLint.
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — verifies the new `give_item_modal`
  keys stay in sync across `en.yaml`/`pt.yaml`; will fail until the translator agent's keys land.

## Notes

- The `private` (`/summary/all.json`) permission resolution for the pc "owner" tier (Step 2) is
  the one open modeling question — confirm the exact `RequestClient`/permission-object behavior
  before assuming `null` is correct; if it isn't, this may need a small `RequestClient` change
  rather than just a config entry, which would need to be flagged back to backend/data-access.
- No forced list-refetch of the pc/npc browse lists after submit — owned counts shown in that list
  (if any) are out of scope for this issue; only the right-side pane's per-row counts are
  guaranteed fresh (via the summary refetch).

# Frontend Plan: Introduce Add document modal

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the four new backend summary endpoints and the widened `regular` acquire/remove
permission tier from [backend.md](backend.md), and the `give_document_modal.*` i18n keys from
[translator.md](translator.md). Produces no contract other agents depend on.

## Implementation Steps

### Step 1 — `documentConfig.js`: new `GET.summary` entry

Mirror `treasureConfig.js`'s `summary` entry (`regular`/`private` variants, `skipCache: true` on
both):

```js
const summaryPath = ({
  gameSlug, documentId, kind, id,
}) => `/games/${gameSlug}/documents/${documentId}/${kind}/${id}/summary.json`;
const summaryAllPath = ({
  gameSlug, documentId, kind, id,
}) => `/games/${gameSlug}/documents/${documentId}/${kind}/${id}/summary/all.json`;

// under GET:
summary: {
  regular: { path: summaryPath, permission: null, skipCache: true },
  private: { path: summaryAllPath, permission: 'can_edit', skipCache: true },
},
```

Check `RequestPermissionResolvers.js` for the existing `treasure.summary` entry and add a mirrored
`document.summary` entry — this is what lets `RequestStore.ensure` auto-pick the `private` variant
for an authorized (staff/owning-player) caller without the modal having to decide explicitly.

### Step 2 — `GiveDocumentModalController.js`

New file under `frontend/assets/js/components/resources/document/pages/elements/controllers/`,
adapted from `GiveTreasureModalController.js` with the quantity concept dropped:

- `fetchCharacterPage`/`loadPage` — unchanged, reused as-is (same `pc`/`npc` collection resources).
- `fetchSummary(gameSlug, documentId, kind, characterId)` — calls `RequestStore.ensure({resource:
  'document', quantityType: 'summary', params: {gameSlug, documentId, kind, id: characterId}})`,
  resolves to `data.owned ?? false` (boolean, not `data.quantity`).
- `addCharacter(character, kind, gameSlug, documentId, receiving, setReceiving)` — if the
  character is already in `receiving`, **no-op** (unlike treasure's `incrementPending` branch — no
  quantity to bump). Otherwise fetch the summary once and push `{character, kind, owned,
  result: null}`.
- **Drop** `totalPending`/`incrementPending`/`decrementPending` entirely — no equivalent concept.
- `removeCharacter` — unchanged (still needed for the "remove from receiving list" affordance).
- `submit(receiving, gameSlug, documentId, canGiveHidden, setters)` — filters `receiving` to
  **non-owned** rows only before mapping to `#submitForCharacter`; owned rows are left in the list
  (still shown, still grayed) but produce no request and no state change.
- `acquire(gameSlug, characterId, kind, documentId, canGiveHidden)` — `RequestStore.mutate({
  resource: 'document', method: 'POST', quantityType: 'acquire', params: {gameSlug, kind, id:
  characterId}, body: {game_document_id: documentId}, variantName: canGiveHidden ? 'private' :
  'regular'})`. No `quantity` in the body (unlike treasure). Note the existing backend 422
  ("already owned") response is a safety net only — the primary guard is the client-side filter
  above.
- `#submitForCharacter` — re-fetches the summary after submit (mirrors treasure), sets
  `result: 'success'|'failure'` per row; no `partialNotice` concept (`acquired` isn't a document
  acquire response field).

### Step 3 — `GiveDocumentModal.jsx` + `GiveDocumentModalHelper.jsx` + `DocumentReceivingRowHelper.jsx`

New files under `document/pages/elements/`, adapted from `GiveTreasureModal.jsx`/
`GiveTreasureModalHelper.jsx`/`TreasureReceivingRowHelper.jsx`:

- Same `TwoColumnLayout browsePane=.../detailPane=...` shell, PC/NPC tabs, debounced search,
  `BrowsePager`.
- No `availableUnits`/remaining-pool header badge (treasure-only concept).
- `DocumentReceivingRowHelper` renders each row grayed out (e.g. `text-muted`, `disabled` list
  item, or equivalent existing "disabled row" styling used elsewhere in the codebase — check
  `ConditionalComponent`/existing disabled-state patterns before inventing a new one) when
  `row.owned` is true, with an `already_owned_tooltip`; otherwise renders like a normal
  removable receiving row (`remove_character_tooltip` on the remove affordance).
- No increment/decrement controls on the row (treasure-only).
- `canGiveHidden` prop (see Step 5) is threaded through exactly like `GiveTreasureModal`'s
  `canEdit` prop, to pick `acquire`'s `regular`/`private` variant.

### Step 4 — Wire the button + modal into `GameDocument.jsx` / `DocumentDetailHelper.jsx`

- `DocumentDetailHelper.render`/`#renderPageActions`: add a "Give Document" button next to the
  existing Edit/file-upload buttons, gated the same way (`ConditionalComponent
  render={canUploadPhoto}` — see Step 6), calling a new `onGiveDocumentClick` param. Mirror
  `ItemDetailHelper`'s button markup (`btn btn-primary`, `Translator.t('give_document_modal.title')`).
- `GameDocument.jsx`: add `showGiveDocumentModal` state, render `<GiveDocumentModal show=...
  document={document ?? {}} gameSlug={gameSlug} canGiveHidden={...} onClose={...} />` alongside
  the existing upload modals — no forced page refetch on success/close (mirrors
  `GiveTreasureModal`'s own rationale: the page displays nothing summary-derived).

### Step 5 — `canGiveHidden` flag for `GameDocumentController`

`GameDocumentController` currently only exposes `canUploadPhoto` (broad: superuser/staff/dm/
player). The `/documents/acquire/all.json` variant needed to give a **hidden** document is gated
narrower — dm/admin only (`check_game_edit`, unchanged per backend.md's Notes) — so reusing
`canUploadPhoto` here would let a staff/player user's give-hidden-document attempt hit a 403.
Add a second, independently-derived flag mirroring `GameItemController`'s existing `canEdit`/
`canUploadPhoto` split: `#loadCanEdit` via `AccessStore.ensureGamePermissions(gameSlug)` →
`can_edit`, exposed as a new `setCanEdit`/`canEdit` constructor param + state, passed to
`GiveDocumentModal` as `canGiveHidden`.

### Step 6 — Retroactive button-visibility fix (all 3 "Give X" pages)

- **GameItem** (`ItemDetailHelper.jsx`): wrap the existing unconditional "Give Item" button in
  `<ConditionalComponent render={canUploadPhoto}>` — `canUploadPhoto` is already computed by
  `GameItemController`, just never wired to this button. Thread it through `ItemDetailHelper.render`
  into `#renderPageActions` (currently doesn't receive it at all).
- **GameTreasure**: `GameTreasureController` has no `canUploadPhoto`-equivalent flag today (only
  merges `AccessStore.getTreasurePermissions` for `can_edit`). Add one, mirroring
  `GameItemController`'s `#canUploadPhoto` static helper exactly (same `AccessStore
  .ensureGameAccess` call, same `is_superuser || is_staff || is_dm || is_player` condition,
  independently derived alongside the existing `can_edit` merge). Wire it into `GameTreasure.jsx`
  and gate `GameTreasureHelper`'s "Give Treasure" button on it (`ConditionalComponent` again).
- **GameDocument**: the new "Give Document" button (Step 4) uses the same `canUploadPhoto` flag
  from the start — no separate fix needed, just don't skip the gate when adding it.

## Files to Change

- `frontend/assets/js/utils/requests/config/documentConfig.js` — new `GET.summary` entry, Step 1
- `frontend/assets/js/utils/requests/RequestPermissionResolvers.js` — new `document.summary`
  resolver entry mirroring `treasure.summary`'s, Step 1
- `frontend/assets/js/components/resources/document/pages/elements/controllers/
  GiveDocumentModalController.js` — new, Step 2
- `frontend/assets/js/components/resources/document/pages/elements/GiveDocumentModal.jsx` — new,
  Step 3
- `frontend/assets/js/components/resources/document/pages/elements/helpers/
  GiveDocumentModalHelper.jsx` — new, Step 3
- `frontend/assets/js/components/resources/document/pages/elements/helpers/
  DocumentReceivingRowHelper.jsx` — new, Step 3
- `frontend/assets/js/components/resources/document/pages/helpers/DocumentDetailHelper.jsx` —
  Give Document button, Step 4
- `frontend/assets/js/components/resources/document/pages/GameDocument.jsx` — modal wiring +
  `canEdit`/`canGiveHidden` state, Steps 4–5
- `frontend/assets/js/components/resources/document/pages/controllers/GameDocumentController.js`
  — new `canEdit` flag, Step 5
- `frontend/assets/js/components/resources/item/pages/helpers/ItemDetailHelper.jsx` — gate Give
  Item button, Step 6
- `frontend/assets/js/components/resources/treasure/pages/controllers/GameTreasureController.js`
  — new `canUploadPhoto`-equivalent flag, Step 6
- `frontend/assets/js/components/resources/treasure/pages/GameTreasure.jsx` — wire the new flag
  through, Step 6
- `frontend/assets/js/components/resources/treasure/pages/helpers/GameTreasureHelper.jsx` — gate
  Give Treasure button, Step 6
- New specs mirroring the treasure/item precedents: `frontend/specs/.../document/pages/elements/
  GiveDocumentModalSpec.js`, `.../controllers/GiveDocumentModalControllerSpec.js` (directory),
  `.../helpers/GiveDocumentModalHelperSpec.js`, plus updated specs for `ItemDetailHelperSpec.js`,
  `GameTreasureControllerSpec.js`, `GameTreasureSpec.js`, `GameTreasureHelperSpec.js`,
  `GameDocumentControllerSpec.js`, `GameDocumentSpec.js`, `DocumentDetailHelperSpec.js` covering
  the new gating/flags

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`) —
  will fail until [translator.md](translator.md)'s keys land in both `en.yaml` and `pt.yaml`

## Notes

- The give-document modal's browse pane never shows ownership state (only the receiving list
  does) — matches the issue text exactly, avoids an N+1 summary fetch per browse page row.
- `canGiveHidden` only matters when the *currently viewed document itself* is hidden — a
  non-editor can't reach this page with a hidden document loaded in the first place (the page's
  own `document.single` fetch already 404s a hidden document for non-editors), so in practice this
  prop only changes behavior for the dm/admin/staff-with-edit audience already able to see hidden
  documents.

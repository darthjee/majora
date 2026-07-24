# Plan: Add more next POST request to go through `RequestStore`

Issue: [841-add-more-next-post-request-to-go-through--requeststore.md](../issues/841-add-more-next-post-request-to-go-through--requeststore.md)

## Overview

Extend the `RequestStore.mutate()`/`resolvePath()`/`purge()` migration introduced in #830 (PC edit, NPC edit, NPC new) to treasures, game/character items, and the game-document "new" page. Add `POST`/`PATCH`/`PUT` entries to `treasureConfig.js`, `itemConfig.js`, and `documentConfig.js`, replace every migrated controller's direct client call with `RequestStore.mutate()` (create/update) or `RequestStore.resolvePath()` (photo-upload init), and purge the affected resource's cached `GET` data on success — including a cross-resource purge for photo uploads, since an upload changes the owning item/treasure's own show/index data. Finish by adding `docs/agents/migration/` with a general explanation of the approach and a checklist of every route in the app still needing it.

## Context

`RequestStore.mutate()`/`resolvePath()`/`purge()` already exist and are fully generic (`frontend/assets/js/utils/requests/RequestStore.js`) — this issue is pure config + call-site migration, no store-level changes expected. The established pattern from #830 (see `BaseCharacterEditController.js` and `GameNpcNewController.js`) is:

- A controller calls `RequestStore.mutate({ componentName, resource, method, quantityType, params, body, variantName })` directly — **no per-resource client method is used for the actual HTTP call**; `RequestStore` dispatches through its own internal `RequestMutationClient`. `variantName` is passed explicitly whenever the caller already knows which variant applies from already-loaded data (e.g. `character.can_edit`), rather than re-resolving permissions redundantly.
- Photo-upload init path resolution has two existing shapes, both already precedent — keep whichever matches how the specific page already resolves it:
  - Synchronous, pre-render (existing-entity pages, e.g. `CharacterEdit.jsx`/`CharacterDetail.jsx`): `resourceConfig.get('POST', resource, 'single').regular.path(params)`, handed to `PhotoUploadModal` as a plain string prop.
  - Asynchronous, post-create (new-entity pages, e.g. `GameNpcNewController.js`): `await RequestStore.resolvePath({ resource, method: 'POST', quantityType, params })`, handed to `PhotoUploadSaga#upload(uploadPath, ...)`.
- Cross-resource cache purge (`variant.purge` array on the resolved config object, consumed by `RequestStore.js`'s `#purgeAfterMutation`) exists in the store but **no config currently populates it** — every current photo-upload purge is done manually at the call site (`RequestStore.purge({ resource })` right after a successful upload). Follow the existing manual-call-site pattern for consistency, unless a route's photo upload needs to purge a *different* resource's cache than its own (none of the routes in this batch do — see Step 5).

### Deviation from the issue's drafted Solution — no new `ItemClient`

The issue text (drafted during discussion) suggested introducing an `ItemClient` mirroring `TreasureClient`'s shape, to replace item updates' current raw `GenericClient#patchJson` calls. Investigation while writing this plan shows that's not how #830 actually migrated PC/NPC: their controllers call `RequestStore.mutate()` directly and use **no resource client at all** for the mutation itself (`RequestMutationClient` is `RequestStore`'s own internal HTTP dispatcher). Introducing an `ItemClient` whose only job would be a method that's immediately bypassed by this same migration doesn't match that precedent and adds an abstraction with no caller. This plan therefore does **not** introduce `ItemClient`; item controllers call `RequestStore.mutate()` directly, same as PC/NPC. Flag this back to the user — they may want issue #841 updated to match (see final report).

## Implementation Steps

### Step 1 — Confirm exact backend gating per route

Before writing config, confirm against `docs/agents/access-control/*.md` (and the backend view, where the doc is ambiguous) exactly which permission each route's `PATCH`/`POST`/`PUT` enforces server-side, and whether a `regular`/`private` split exists at all (already confirmed for game items: `game_item_detail.py` — `GET /games/:slug/items/:id.json` handles both `GET` and `PATCH` inline-gated via `GameEditPermission.check()`; `.../full.json` is **GET-only**, DM/superuser hidden-item read — so item `PATCH.single` is a single un-branched variant, unlike PC/NPC's `regular`-vs-`/full.json` split). Confirm the equivalent for character items, treasures (game + standalone), and document create, before finalizing Steps 2–4's config shape.

### Step 2 — Extend `treasureConfig.js` with mutation entries

Add to `frontend/assets/js/utils/requests/config/treasureConfig.js`:
- `POST.collection`: create, branching `kind` the same way `GET.collection` does (`gamePath`/`gameFullPath` reuse not applicable to POST — game-catalog create is `POST /games/:game_slug/treasures.json`; standalone create is `POST /treasures.json`, no `gameSlug`/`kind` needed — model as two distinct path builders selected by presence of `gameSlug` in params, mirroring `singlePath`'s existing `gameSlug ? ... : ...` idiom).
- `PATCH.single`: update, reusing the existing `singlePath` builder (`gameSlug ? /games/:slug/treasures/:id.json : /treasures/:id.json`) — `regular`/`private` point at the same object (no full-editor split for treasure PATCH, confirmed by `TreasureClient#updateTreasure`/`#updateGameTreasure` both hitting the plain path today).
- `POST.single`: photo-upload init (`/treasures/:id/photo_upload.json` — standalone only; game-scoped treasures have no separate photo-upload route in the "Next routes" list, confirm during Step 1).

### Step 3 — Extend `itemConfig.js` with mutation entries

Add to `frontend/assets/js/utils/requests/config/itemConfig.js`:
- `PATCH.single`: update, reusing the existing `gameSinglePath`/`characterSinglePath` builders keyed by `kind` (same branching `GET.single` already uses) — `regular`/`private` point at the same object, `permission: 'can_edit'` (server-enforced inline, no separate full-editor path per Step 1's finding).
- `POST.collection`: create, reusing `gameCollectionPath`/`characterCollectionPath` builders keyed by `kind`.
- `POST.single`: photo-upload init, new path builders for `/games/:game_slug/items/:id/photo_upload.json` (game) and `/games/:game_slug/:kind/:id/items/:item_id/photo_upload.json` (character-owned — note this hits the *game item's* id, not the `CharacterItem`'s id, per `CharacterItemNewController`'s current hand-built path; confirm exact param name needed, likely `gameItemId` alongside `id`/`itemId`).

### Step 4 — Extend `documentConfig.js` with a `POST.collection` entry

Add `POST /games/:game_slug/documents.json` create entry to `frontend/assets/js/utils/requests/config/documentConfig.js`, mirroring `GameClient#createDocument`'s current path. No photo upload (documents have none, confirmed).

### Step 5 — Migrate treasure controllers to `RequestStore.mutate()`

- `TreasureNewController.js` / `GameTreasureNewController.js` — replace `treasureClient.createTreasure`/`createGameTreasure` with `RequestStore.mutate({ resource: 'treasure', method: 'POST', quantityType: 'collection', params, body })`.
- `TreasureEditController.js` / `GameTreasureEditController.js` — replace `treasureClient.updateTreasure`/`updateGameTreasure` with `RequestStore.mutate({ resource: 'treasure', method: 'PATCH', quantityType: 'single', params, body })`.
- `Treasures.jsx`/`TreasuresHelper.jsx` (photo upload, list page) — resolve `uploadPath` via `resourceConfig.get('POST', 'treasure', 'single').regular.path(params)` (sync, existing-entity pattern), and on `PhotoUploadModal` success call `RequestStore.purge({ resource: 'treasure' })` before the existing refresh effect, mirroring `CharacterEdit.jsx`'s `handleUploadSuccess`.

### Step 6 — Migrate item controllers to `RequestStore.mutate()`

- `GameItemNewController.js` — replace `gameClient.createItem` with `RequestStore.mutate({ resource: 'item', method: 'POST', quantityType: 'collection', params: { gameSlug, kind: 'game' }, body })`; replace the hand-built photo-upload path with `await RequestStore.resolvePath({ resource: 'item', method: 'POST', quantityType: 'single', params: { gameSlug, kind: 'game', id: createdItemId } })` before calling `photoUploadSaga.upload(...)`, then `RequestStore.purge({ resource: 'item' })` on success (mirrors `GameNpcNewController.js`'s `#uploadPhoto` exactly).
- `GameItemEditController.js` — replace the raw `GenericClient#patchJson` call with `RequestStore.mutate({ resource: 'item', method: 'PATCH', quantityType: 'single', params: { gameSlug, kind: 'game', id }, body })`.
- `GameItem.jsx` (photo upload) — resolve `uploadPath` via `resourceConfig.get('POST', 'item', 'single').regular.path({ gameSlug, kind: 'game', id })`, purge `'item'` on success.
- `CharacterItemNewController.js` (shared PC/NPC) — replace `characterClient.createItem` with `RequestStore.mutate({ resource: 'item', method: 'POST', quantityType: 'collection', params: { gameSlug, kind: characterKind, id: characterId }, body })`; replace the hand-built photo-upload path with `RequestStore.resolvePath(...)` using the created `GameItem`'s id, then purge `'item'`.
- `BaseCharacterItemEditController.js` (shared PC/NPC) — replace the raw `GenericClient#patchJson` call with `RequestStore.mutate({ resource: 'item', method: 'PATCH', quantityType: 'single', params: { gameSlug, kind: characterKind, id: characterId, itemId }, body })`.
- `PcCharacterItem.jsx`/`NpcCharacterItem.jsx` (via shared `CharacterItemDetailController`/`shared/CharacterItem.jsx`, photo upload) — resolve `uploadPath` via `resourceConfig.get(...)`, purge `'item'` on success.

### Step 7 — Migrate `GameDocumentNewController.js`

Replace `gameClient.createDocument` with `RequestStore.mutate({ resource: 'document', method: 'POST', quantityType: 'collection', params: { gameSlug }, body })`. No photo-upload change needed.

### Step 8 — Remove dead client mutation methods

Once every call site above is migrated, check whether `TreasureClient#createTreasure`/`#updateTreasure`/`#createGameTreasure`/`#updateGameTreasure`, `GameClient#createItem`/`#createDocument`, and `CharacterClient#createItem` still have any caller left in `frontend/assets/js/`. Delete any that don't — the project convention is no unused code, and these become dead the moment their one remaining caller switches to `RequestStore.mutate()`. Do **not** touch `TreasureClient`'s read-only methods (`fetchTreasureAccess`, `fetchTreasurePermissions`, etc.) — those back separate permission-check flows outside this migration's scope.

### Step 9 — Specs

For every controller touched in Steps 5–7, update (or add) its Jasmine spec following the pattern already established for #830's migrated controllers (see `BaseCharacterEditController/submitFormSpec.js` and `GameNpcNewController/submitFormPhotoUploadSpec.js`):
- `spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({ ok, status, json: () => Promise.resolve({...}) }))` — plain object stand-ins for `Response`, not a full polyfill.
- Assert the full `mutate`/`resolvePath` call args verbatim (`resource`, `method`, `quantityType`, `params`, `body`, `variantName` where applicable).
- `spyOn(RequestStore, 'purge')` (bare, call-tracking only) — assert it's called with the right `{ resource }` on success and **not called** on every failure path.
- Cover success/200, validation-error/400, generic-failure, and rejected-promise cases per controller, same as the existing PC/NPC specs.

### Step 10 — `docs/agents/migration` documentation

Create `docs/agents/migration/` (does not exist yet) with:
- A general, non-endpoint-specific explanation of the mutation-migration approach (the "Context" section above is a good starting point — describe the config shape, `RequestStore.mutate()`/`resolvePath()`/`purge()` contract, and the photo-upload two-pattern split), so future migration issues can link to it instead of re-deriving it during discussion.
- A checklist of every route in the app (see the issue's "Documentation" section for the full 47-route list gathered from #841's discussion), marking done: PC edit, NPC edit, NPC new (#830), plus every route this issue completes. Update this checklist as part of this issue's own PR, not just future ones.
- Note in the doc's own header that it is deleted once the last route is checked off.

### Step 11 — Reference the new doc from `docs/agents/architecture.md`

Add a row for `docs/agents/migration/` to the documentation table in `docs/agents/architecture.md`, same as every other doc listed there.

## Files to Change

- `frontend/assets/js/utils/requests/config/treasureConfig.js` — add `POST`/`PATCH` mutation entries.
- `frontend/assets/js/utils/requests/config/itemConfig.js` — add `POST`/`PATCH` mutation entries.
- `frontend/assets/js/utils/requests/config/documentConfig.js` — add `POST` collection entry.
- `frontend/assets/js/components/resources/treasure/pages/controllers/TreasureNewController.js`, `GameTreasureNewController.js`, `TreasureEditController.js`, `GameTreasureEditController.js` — switch to `RequestStore.mutate()`.
- `frontend/assets/js/components/resources/treasure/pages/Treasures.jsx` (or `TreasuresHelper.jsx`) — photo-upload path resolution + purge.
- `frontend/assets/js/components/resources/item/pages/controllers/GameItemNewController.js`, `GameItemEditController.js` — switch to `RequestStore.mutate()`/`resolvePath()`.
- `frontend/assets/js/components/resources/item/pages/GameItem.jsx` — photo-upload path resolution + purge.
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterItemNewController.js`, `BaseCharacterItemEditController.js` — switch to `RequestStore.mutate()`/`resolvePath()`.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterItem.jsx` (or wherever `PcCharacterItem.jsx`/`NpcCharacterItem.jsx` share photo-upload logic) — photo-upload path resolution + purge.
- `frontend/assets/js/components/resources/game/pages/controllers/GameDocumentNewController.js` — switch to `RequestStore.mutate()`.
- `frontend/assets/js/client/TreasureClient.js`, `GameClient.js`, `CharacterClient.js` — remove now-dead mutation methods (Step 8), only once confirmed unused.
- `frontend/specs/assets/js/...` — one spec file per controller touched above.
- `docs/agents/migration/` (new) — general explanation + route checklist.
- `docs/agents/architecture.md` — add a documentation-table row for the new doc.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe npm test` (CI job: `jasmine`)

## Notes

- No new `ItemClient` is introduced — see "Deviation from the issue's drafted Solution" above. Flagged back to the user; issue #841's Solution text may need a follow-up edit to match.
- The item/treasure exchange modal mutations (Acquire/Remove/Buy/Sell) are explicitly out of scope per the issue — do not touch `AcquireItemTabController.js` and siblings in this issue.
- Exact permission-gating strings for character-item PATCH/POST and treasure POST need confirming against `docs/agents/access-control/character-item.md`/`treasure.md`/`game-treasure.md` during implementation (Step 1) — this plan describes the shape, not the final permission string, for any endpoint not already directly confirmed against a backend view above.
- `docs/agents/migration`'s full route checklist should be copied from the issue file's own "Documentation" → "Route list" section (already gathered during discussion) rather than re-derived.

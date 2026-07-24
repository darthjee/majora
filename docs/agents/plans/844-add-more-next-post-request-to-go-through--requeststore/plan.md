# Plan: Add more next POST request to go through `RequestStore`

Issue: [844-add-more-next-post-request-to-go-through--requeststore.md](../../issues/844-add-more-next-post-request-to-go-through--requeststore.md)

## Overview
Continue the `RequestStore` mutation migration (see [docs/agents/migration/README.md](../../migration/README.md)) for: the item/treasure exchange-modal tabs (acquire/remove/buy/sell), character profile-photo selection, photo-upload path resolution (4 call sites), and game create/edit. All work is frontend-only (`frontend/assets/js/**`), so this is a single, unsplit plan.

Investigation while planning turned up two things that shrink the actual scope versus the issue's Solution section:
- **Character profile-photo selection is already fully wired** — `pcConfig.js`/`npcConfig.js` already have a `PATCH.photo` entry, and `CharacterController#setProfilePhoto` (used by the character *edit* page) already calls `RequestStore.mutate` with it. The only remaining work is making `BaseCharacterPhotosController#setProfilePhoto` (used by the standalone character *photos index* page) do the same instead of calling `CharacterClient.setPhotoRoles`.
- **Photo-upload path resolution needs zero new config for 3 of the 4 call sites** — `pcConfig.js`/`npcConfig.js`/`treasureConfig.js` already have the `POST.single` (`photoUploadInit`) entry each page needs; the pages just build the path raw instead of reading it from `resourceConfig`. Only the game's own photo upload (`GamePhotos.jsx`) needs a genuinely new config entry, since `gameConfig.js` has no `POST` section yet.

## Context
`RequestStore.mutate({ componentName, resource, method, quantityType, params, body, variantName })` dispatches a mutation and purges that resource's settled `GET` cache on success (`RequestStore.ensure` is the `GET`-side equivalent, already used everywhere here for reads). `resourceConfig.get(method, resource, quantityType)` returns a resolved `{ regular, private }` path/permission pair; when the caller already knows which variant applies (e.g. `character.canEdit`/`character.gameCanEdit`, already loaded before these mutations fire), pass `variantName` explicitly instead of re-resolving permissions.

## Implementation Steps

### Step 1 — Item resource config: acquire/remove
Add two new `POST` quantity-type-like keys to `frontend/assets/js/utils/requests/config/itemConfig.js`, following the existing `photoUploadInit`/`createCollection` pattern (a plain object, no `regular`/`private` branch needed beyond pointing both variant names at the right path):
- `acquire`: `regular` → `/games/:gameSlug/:kind/:id/items/acquire.json` (mirrors `AcquireItemTabController#acquire`'s player path), `private` → `/games/:gameSlug/:kind/:id/items/acquire/all.json` (the DM/admin path, currently `CharacterClient#acquireItemAll`).
- `remove`: `regular` → `.../items/remove.json`, `private` → `.../items/remove/all.json` (currently `CharacterClient#removeItem`/`removeItemAll`).

Both need `gameSlug`, `kind` (`'pcs'`/`'npcs'`), `id` (character id) params — same shape `collection`/`availableCollection` already use.

### Step 2 — Treasure resource config: acquire/remove/buy/sell
Add to `frontend/assets/js/utils/requests/config/treasureConfig.js`:
- `acquire`: `regular` → `.../treasures/acquire.json`, `private` → `.../treasures/acquire/all.json` (currently `CharacterClient#acquireTreasure`/`acquireTreasureAll`).
- `buy`: `regular` → `.../treasures/buy.json`, `private` → `.../treasures/buy/all.json` (currently `buyTreasure`/`buyTreasureAll`).
- `remove`: only one endpoint exists (`.../treasures/remove.json`, currently `removeTreasure`) — `regular`/`private` point at the same object, same as this file's existing `single`/`ownedCollection` entries.
- `sell`: only one endpoint exists (`.../treasures/sell.json`, currently `sellTreasure`) — same single-object treatment as `remove`.

All four need `gameSlug`, `kind`, `id` params.

### Step 3 — Wire the exchange-modal tab controllers to `RequestStore.mutate`
Update the six controllers under `frontend/assets/js/components/resources/character/pages/elements/tabs/controllers/`:
- `AcquireItemTabController#acquire`, `RemoveItemTabController#remove`, `AcquireTreasureTabController#acquire`, `RemoveTreasureTabController#remove`, `BuyTreasureTabController#buy`, `SellTreasureTabController#sell`.

Each currently calls `this.characterClient.<verb>[All](...)`. Replace with `RequestStore.mutate({ componentName: '<ClassName>', resource: 'item'|'treasure', method: 'POST', quantityType: '<acquire|remove|buy|sell>', params: { gameSlug, kind, id: characterId }, body, variantName })`, passing `variantName: canEdit/gameCanEdit ? 'private' : 'regular'` in place of today's `isPc`+`canEdit`-driven branch to `...All`. The `AuthStorage`/`CharacterClient` imports and constructor-injected `characterClient` can be dropped once no method still uses it (double-check each file — some may keep it if any other method still needs it; none currently appear to). Response parsing (`#parseActionResponse`) stays the same shape (`RequestStore.mutate` still resolves to a `Response`).

After a successful acquire/remove/buy/sell, call `RequestStore.purge({ resource: 'item' })`/`RequestStore.purge({ resource: 'treasure' })` so the character's own item/treasure `GET` cache doesn't go stale (the existing `reload()` call in each `confirm*` method re-fetches through `RequestStore.ensure`, which will now see the purged cache).

### Step 4 — Character profile-photo selection: reuse existing config
In `frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterPhotosController.js#setProfilePhoto`, replace the `this.characterClient.setPhotoRoles(...)` call with `RequestStore.mutate({ componentName: 'BaseCharacterPhotosController', resource: this.characterKind === 'pcs' ? 'pc' : 'npc', method: 'PATCH', quantityType: 'photo', params: { gameSlug, id: characterId, photoId }, body: { roles: ['profile'] } })` — mirroring `CharacterController#setProfilePhoto` exactly (same config entry, same resource names). No config changes needed here.

### Step 5 — Photo-upload path resolution (3 call sites reuse existing config, 1 needs new config)
Replace the raw template-literal `uploadPath` in each of:
- `frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx:81` → `resourceConfig.get('POST', characterKind === 'pcs' ? 'pc' : 'npc', 'single').regular.path({ gameSlug, id: characterId })`, mirroring `CharacterDetail.jsx:130`.
- `frontend/assets/js/components/resources/treasure/pages/helpers/GameTreasuresHelper.jsx:65` → `resourceConfig.get('POST', 'treasure', 'single').regular.path({ id: state.selectedTreasure?.id })`, mirroring `TreasuresHelper.jsx:54` verbatim (same endpoint, standalone-only per `treasureConfig.js`'s own doc comment — the game-scoped page hits the same URL).
- `frontend/assets/js/components/resources/game/pages/GamePhotos.jsx:53` → `resourceConfig.get('POST', 'game', 'single').regular.path({ gameSlug })`, which requires Step 5b below since `gameConfig.js` has no `POST` section yet.

**Step 5b** — Add to `frontend/assets/js/utils/requests/config/gameConfig.js`:
```js
POST: {
  single: {
    regular: { path: ({ gameSlug }) => `/games/${gameSlug}/photo_upload.json`, permission: null },
    private: { path: ({ gameSlug }) => `/games/${gameSlug}/photo_upload.json`, permission: null },
  },
},
```
(one un-branched object, same as every other resource's photo-upload-init entry — permission enforced server-side).

### Step 6 — Game create/edit
Add to `gameConfig.js` (alongside Step 5b's `POST.single`):
```js
POST: {
  collection: { regular: create, private: create }, // create = { path: () => '/games.json', permission: null }
  single: { /* from Step 5b */ },
},
PATCH: {
  single: { regular: patch, private: patch }, // patch = { path: ({ gameSlug }) => `/games/${gameSlug}.json`, permission: null }
},
```

Then:
- `frontend/assets/js/components/resources/game/pages/controllers/GameNewController.js#performCreate` — replace `this.gameClient.createGame(token, {...})` with `RequestStore.mutate({ componentName: 'GameNewController', resource: 'game', method: 'POST', quantityType: 'collection', params: {}, body: {...} })`.
- `frontend/assets/js/components/resources/game/pages/controllers/GameEditController.js#submitForm` — replace `this.gameClient.updateGame(gameSlug, token, {...})` with `RequestStore.mutate({ componentName: 'GameEditController', resource: 'game', method: 'PATCH', quantityType: 'single', params: { gameSlug }, body: {...} })`.

Both currently return a raw `fetch` `Response` consumed by status-code branching (`response.status === 201`/`400`) in `#handleResponse`/`BaseEditController#performSubmit` — confirm `RequestStore.mutate`'s resolved `Response` still supports that (it does for every other migrated controller, e.g. `GameTreasureNewController`).

No cache purge is meaningful for `games/new` (nothing cached yet for a brand-new slug) or `games/:slug/edit` beyond the standard same-resource purge `RequestStore.mutate` already performs automatically.

### Step 7 — Update the migration doc
Move all migrated routes from `docs/agents/migration/README.md`'s "Not yet migrated" section into "Migrated", tagged `(#844)`. Routes that move: `/#/games/:game_slug/pcs|npcs/:character_id/treasures` (exchange), `.../items` (exchange), `.../photos` (profile-photo select + upload), `/#/games/:game_slug/treasures` photo upload, `/#/games/:game_slug/photos` photo upload, `/#/games/new`, `/#/games/:game_slug/edit`. Leave "Exchange modal tabs" section's note removed/updated since this issue is exactly that follow-up.

## Files to Change
- `frontend/assets/js/utils/requests/config/itemConfig.js` — add `POST.acquire`/`POST.remove`
- `frontend/assets/js/utils/requests/config/treasureConfig.js` — add `POST.acquire`/`POST.buy`/`POST.remove`/`POST.sell`
- `frontend/assets/js/utils/requests/config/gameConfig.js` — add `POST.collection`, `POST.single`, `PATCH.single`
- `frontend/assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireItemTabController.js`
- `frontend/assets/js/components/resources/character/pages/elements/tabs/controllers/RemoveItemTabController.js`
- `frontend/assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireTreasureTabController.js`
- `frontend/assets/js/components/resources/character/pages/elements/tabs/controllers/RemoveTreasureTabController.js`
- `frontend/assets/js/components/resources/character/pages/elements/tabs/controllers/BuyTreasureTabController.js`
- `frontend/assets/js/components/resources/character/pages/elements/tabs/controllers/SellTreasureTabController.js`
- `frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterPhotosController.js` — `setProfilePhoto` via `RequestStore.mutate`
- `frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx` — upload path via `resourceConfig`
- `frontend/assets/js/components/resources/treasure/pages/helpers/GameTreasuresHelper.jsx` — upload path via `resourceConfig`
- `frontend/assets/js/components/resources/game/pages/GamePhotos.jsx` — upload path via `resourceConfig`
- `frontend/assets/js/components/resources/game/pages/controllers/GameNewController.js`
- `frontend/assets/js/components/resources/game/pages/controllers/GameEditController.js`
- `docs/agents/migration/README.md` — checklist update
- Corresponding specs under `frontend/specs/...` for every controller/component above (see Notes)

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`, only if any translation keys change — unlikely here since no new user-facing strings are introduced)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes
- Follow the migration doc's spec convention: `spyOn(RequestStore, 'mutate')` returning a plain `{ ok, status, json: () => Promise.resolve({...}) }` stand-in, asserting full call args verbatim; `spyOn(RequestStore, 'purge')` bare, asserting called on success paths and not on failure paths (add this assertion to the exchange-tab specs, which today assert `characterClient.acquire/remove/buy/sell` calls instead).
- Double-check whether `CharacterClient`'s six exchange methods (`acquireItem[All]`, `removeItem[All]`, `acquireTreasure[All]`, `removeTreasure`, `buyTreasure[All]`, `sellTreasure`) and `setPhotoRoles` become fully unused after this issue — if so, delete them from `CharacterClient.js` (and their specs) rather than leaving dead code, same as #841 removed `TreasureClient`'s now-unused methods.
- `GameClient.createGame`/`updateGame` likely also become unused after Step 6 — same deletion check applies to `GameClient.js`.
- The six tab controllers are shared verbatim between PC and NPC routes (parameterized by `characterKind`/`isPc` already) — migrating each controller once covers both routes; no PC/NPC-specific branching is needed beyond what already exists.
- `RemoveTreasureTabController`/`SellTreasureTabController` have no DM/admin `...All` endpoint today (confirmed in `CharacterClient.js`) — don't invent a `private` variant that doesn't exist server-side; `regular`/`private` config should point at the same object, matching `AcquireTreasureTabController`'s asymmetry already documented in `treasureConfig.js`.

# Frontend Plan: Frontend — Resource-specific edit permissions for show pages and photo upload

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes four new backend endpoints (built in [backend.md](backend.md)), each `{"can_edit": boolean}`, entity-agnostic, `?role=`-simulatable:

- `GET /permissions/game_possession.json`
- `GET /permissions/game_item.json`
- `GET /permissions/game_faction.json`
- `GET /permissions/game_document.json`

These resources have no owner/scoped concept of their own — role derivation is always at the game level, exactly like `ensureGamePermissions` today (reuse `AccessStoreAccess.ensureGame`/`getGame(cache, gameClient, gameSlug)` for the role set, not a new `*Access` family).

## Implementation Steps

### Step 1 — Add fetch methods to `GameClient`

`frontend/assets/js/client/GameClient.js` already has `fetchGamePermissions(gameSlug, token, signal, roles = [])` calling `/permissions/game.json`, ignoring `gameSlug` in the URL (entity-agnostic route, kept for signature symmetry with the rest of the client). Add four siblings the same shape, one per new endpoint:

```js
fetchPossessionPermissions(gameSlug, token, signal, roles = []) {
  return this.getJson(`/permissions/game_possession.json${this.buildRoleQuery(roles)}`, token, {}, signal);
}
```

...and `fetchItemPermissions` → `/permissions/game_item.json`, `fetchFactionPermissions` → `/permissions/game_faction.json`, `fetchDocumentPermissions` → `/permissions/game_document.json`.

### Step 2 — Add cache-key builders to `AccessStoreKeys`

`frontend/assets/js/utils/access/store/AccessStoreKeys.js`: add `possessionPermissions`, `itemPermissions`, `factionPermissions`, `documentPermissions`, mirroring `gamePermissions(gameSlug, roleSet)`'s exact shape:

```js
static possessionPermissions(gameSlug, roleSet) {
  return `permissions:possession:${gameSlug}:${roleSet.join(',')}`;
}
```

(same for `item`, `faction`, `document`).

### Step 3 — Add `ensure*` methods to `AccessStorePermissions`

`frontend/assets/js/utils/access/store/AccessStorePermissions.js`: add `ensurePossession(cache, gameClient, gameSlug)`, `ensureItem(...)`, `ensureFaction(...)`, `ensureDocument(...)`, each mirroring `ensureGame` exactly — same `#selfCorrectingEnsure(fetchForRoleSet, AccessStoreAccess.getGame(cache, gameSlug), AccessStoreAccess.ensureGame(cache, gameClient, gameSlug))` call, just swapping the cache key builder and the `gameClient` fetch method:

```js
static ensurePossession(cache, gameClient, gameSlug) {
  const fetchForRoleSet = (roleSet) => AccessStorePermissions.#loggedEnsure(
    cache,
    AccessStoreKeys.possessionPermissions(gameSlug, roleSet),
    'ensurePossession',
    [gameSlug],
    (signal) => gameClient.fetchPossessionPermissions(gameSlug, AuthStorage.getToken(), signal, roleSet)
      .then(AccessStorePermissions.#parse),
    PERMISSIONS_DEFAULT,
    { roleSet },
  );

  return AccessStorePermissions.#selfCorrectingEnsure(
    fetchForRoleSet,
    AccessStoreAccess.getGame(cache, gameSlug),
    AccessStoreAccess.ensureGame(cache, gameClient, gameSlug),
  );
}
```

No corresponding `get*` (synchronous) variant is needed unless something in the codebase calls `AccessStorePermissions.getGame` for the equivalent case today — check, and only add if `getGame`'s pattern is actually relied on elsewhere for parity (it is not currently called by any controller in this plan, only `ensureGame`).

### Step 4 — Add `ensure*Permissions` methods to `AccessStore`

`frontend/assets/js/utils/access/store/AccessStore.js`: add `ensurePossessionPermissions(gameSlug)`, `ensureItemPermissions(gameSlug)`, `ensureFactionPermissions(gameSlug)`, `ensureDocumentPermissions(gameSlug)`, each a one-line delegate mirroring `ensureGamePermissions`:

```js
static ensurePossessionPermissions(gameSlug) {
  return AccessStorePermissions.ensurePossession(cache, gameClient, gameSlug);
}
```

### Step 5 — Repoint the four show-page controllers

In each of:
- `frontend/assets/js/components/resources/possession/pages/controllers/GamePossessionController.js` (`#loadCanEdit`)
- `frontend/assets/js/components/resources/item/pages/controllers/GameItemController.js`
- `frontend/assets/js/components/resources/faction/pages/controllers/GameFactionController.js`
- `frontend/assets/js/components/resources/document/pages/controllers/GameDocumentController.js`

change the `#loadCanEdit`/equivalent method's `AccessStore.ensureGamePermissions(gameSlug)` call to the matching new `AccessStore.ensure<Resource>Permissions(gameSlug)` call. Leave `#loadCanUploadPhoto` (already correct, uses `ensureGameAccess`) untouched in all four.

### Step 6 — Fix `GamePhotosController.js`'s upload button

`frontend/assets/js/components/resources/game/pages/controllers/GamePhotosController.js`'s `#mergeAccess` (lines 87-96) currently does:

```js
return AccessStore.ensureGamePermissions(gameSlug)
  .then((permissions) => safeSet(this.setGame, { ...game, ...permissions }))
  .catch(() => safeSet(this.setGame, { ...game, can_edit: false }));
```

Replace the `ensureGamePermissions` call with `AccessStore.ensureGameAccess(gameSlug)`, computing `can_edit` the same way `#canUploadPhoto` does in `GamePossessionController.js` (`Boolean(access.is_superuser || access.is_staff || access.is_dm || access.is_player)`), so the merged `game` object keeps the exact same `can_edit` field shape the `GamePhotos` view component already reads — only how the boolean is computed changes, not the response contract:

```js
return AccessStore.ensureGameAccess(gameSlug)
  .then((access) => safeSet(this.setGame, { ...game, can_edit: GamePhotosController.#canUploadPhoto(access) }))
  .catch(() => safeSet(this.setGame, { ...game, can_edit: false }));
```

with a private static `#canUploadPhoto(access)` mirroring `GamePossessionController.#canUploadPhoto` exactly. No new backend call needed — `ensureGameAccess` already exists and is already correct for this.

### Step 7 — Tests

- New spec files mirroring `frontend/specs/assets/js/utils/access/store/AccessStorePermissions/ensureGameSpec.js`: `ensurePossessionSpec.js`, `ensureItemSpec.js`, `ensureFactionSpec.js`, `ensureDocumentSpec.js` in the same `AccessStorePermissions/` spec folder.
- Update/extend `frontend/specs/assets/js/utils/access/store/permissionsSpec.js` (or wherever `AccessStore.ensureGamePermissions` itself is spec'd) for the four new `AccessStore.ensure*Permissions` delegates.
- Update the existing controller specs (`GamePossessionControllerSpec.js` and its item/faction/document siblings) to assert the new resource-specific `ensure*Permissions` call instead of `ensureGamePermissions`.
- Update `GamePhotosController`'s spec for the new `ensureGameAccess`-based gate.

## Files to Change

- `frontend/assets/js/client/GameClient.js` — 4 new fetch methods
- `frontend/assets/js/utils/access/store/AccessStoreKeys.js` — 4 new cache-key builders
- `frontend/assets/js/utils/access/store/AccessStorePermissions.js` — 4 new `ensure*` methods
- `frontend/assets/js/utils/access/store/AccessStore.js` — 4 new `ensure*Permissions` delegates
- `frontend/assets/js/components/resources/possession/pages/controllers/GamePossessionController.js`
- `frontend/assets/js/components/resources/item/pages/controllers/GameItemController.js`
- `frontend/assets/js/components/resources/faction/pages/controllers/GameFactionController.js`
- `frontend/assets/js/components/resources/document/pages/controllers/GameDocumentController.js`
- `frontend/assets/js/components/resources/game/pages/controllers/GamePhotosController.js`
- Matching specs under `frontend/specs/...` for every file above

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- Step 6 (`GamePhotosController`) has no dependency on the backend endpoints and can be implemented and merged independently of Steps 1-5/backend.md landing.
- Steps 1-5 are blocked on [backend.md](backend.md)'s four endpoints existing (at least locally, if not yet deployed) — calling a 404 endpoint fails closed (`can_edit: false`, per `PERMISSIONS_DEFAULT`), so tests against the real endpoints (not mocked) would silently show "no edit access" rather than erroring if sequenced wrong.

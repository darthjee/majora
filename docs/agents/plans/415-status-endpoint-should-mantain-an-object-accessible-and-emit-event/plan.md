# Plan: Status endpoint should mantain an object accessible and emit event

Issue: [415-status-endpoint-should-mantain-an-object-accessible-and-emit-event.md](../../issues/415-status-endpoint-should-mantain-an-object-accessible-and-emit-event.md)

## Overview

Introduce a centralized, frontend-only `AccessStore` that owns all access-check state
(game, character, treasure, and staff/superuser access) currently scattered across ~19
page controllers, each of which calls `GameClient.fetchGameAccess` /
`CharacterClient.fetchCharacterAccess` / `TreasureClient.fetchTreasureAccess` /
`AdminAccess.isSuperUser`/`isStaffOrSuperUser` independently. `AccessStore` resets on
every route change, (re)fetches per a route→access configuration table, cancels and
restarts in-flight requests on login/logout, fails closed while a request is pending,
and emits an event (following the existing `AuthEvents`/`LanguageEvents` pub-sub
convention) when a request finishes. Every existing caller is migrated to read through
it instead of hitting the access endpoints directly.

## Context

Per the issue and the confirmed scope: this covers building the new object *and*
migrating all existing callers (page controllers), and includes the `AdminAccess`
staff/superuser check as one of the access kinds this object manages. There is no
backend change — all three access endpoints (`/games/:slug/access.json`,
`/games/:slug/:kind/:id/access.json`, `/treasures/:id/access.json`) and
`/users/status.json` (used by `AdminAccess`) already exist and are unchanged.

Current state (from codebase exploration):
- No shared store exists yet. Each controller fetches and merges access inline
  (e.g. `GameController.js:90-102` `#mergeAccess`, `CharacterController.js:148-153`
  `fetchAndMergeAccess`, `BaseEditController.js:94-107` `fetchWithAccess`).
- Routing is a custom hash router (`Router.js`/`HashRouteResolver.js`), resolved by
  `AppController.buildEffect()` (`AppController.js:58-77`) on the `hashchange` event —
  this is the natural route-change hook.
- The codebase already has a pub-sub convention for this exact kind of cross-cutting
  notification: `AuthEvents.js` and `LanguageEvents.js`, both static classes wrapping a
  `window` `CustomEvent`. `AccessEvents` should follow the same shape.
- Login/logout already emit `AuthEvents.emit(true/false)` (`HeaderController.js:182,229`,
  `LoginModalController.js:117`, `RegisterController.js:57`) — this is the hook for
  reload-on-auth-change.
- `AuthStorage.js` shows the established pattern for a stateful static-class singleton
  (module-level closure variable + static methods) — `AccessStore` follows this shape.
- `BaseClient.request()` already accepts an optional `signal` (`BaseClient.js:27,41-43`),
  but the JSON convenience wrappers (`getJson`, used by the access-fetch methods) don't
  expose it yet — needed to actually cancel in-flight requests.

## Implementation Steps

### Step 1 — Add `AccessEvents`

Create `frontend/assets/js/utils/AccessEvents.js`, a byte-for-byte structural copy of
`AuthEvents.js`/`LanguageEvents.js`: a `window` `CustomEvent` named `access:changed`,
with `static emit(detail)`, `static subscribe(handler)`, `static unsubscribe(handler)`.
`detail` carries `{ key }`, the access key that just resolved (see Step 2 for key
shapes), so a subscriber can cheaply ignore events for keys it doesn't care about.

### Step 2 — Add `AccessStore`

Create `frontend/assets/js/utils/AccessStore.js`, a static class over module-level
state (same shape as `AuthStorage.js`): a `Map` of `key -> { status, data, promise,
controller }` (`status` one of `'pending'`/`'ready'`) plus the currently-tracked
`pageKey`/`hash` (needed to re-derive what to (re)fetch on auth change).

Key builders (one deterministic string key per access kind + identity):
- Game: `` `game:${gameSlug}` ``
- Character: `` `character:${characterKind}:${gameSlug}:${characterId}` ``
- Treasure: `` `treasure:${treasureId}` ``
- Superuser: `'admin:superuser'`
- Staff-or-superuser: `'admin:staff'`

Public API:
- `ensureGameAccess(gameSlug)`, `ensureCharacterAccess(kind, gameSlug, characterId)`,
  `ensureTreasureAccess(id)`, `ensureSuperUser()`, `ensureStaffOrSuperUser()` — each
  returns a `Promise` resolving to the access payload (`{ can_edit: boolean }` for the
  resource kinds, `boolean` for the admin kinds). If a cached ready result exists for
  the key, resolve immediately with it. If a request is already in flight for that key,
  return the *same* promise (dedupes concurrent callers). Otherwise start a new request,
  store its `AbortController` and promise, and on success cache the result, emit
  `AccessEvents.emit({ key })`, and resolve; on failure (including non-ok response)
  cache the fail-closed default (`{ can_edit: false }` / `false`), still emit the event,
  and resolve with the default rather than rejecting (mirrors today's `.catch(() => ({
  can_edit: false }))` fallback pattern used throughout the controllers). An aborted
  request (see Step 4) must **not** cache a fail-closed result — it should leave no
  cached entry so the next `ensureX` call starts fresh.
- `getGameAccess(gameSlug)`, `getCharacterAccess(...)`, `getTreasureAccess(id)`,
  `isSuperUser()`, `isStaffOrSuperUser()` — synchronous reads of whatever is currently
  cached, returning the fail-closed default when the key has no ready entry yet
  (absent, or `status === 'pending'`). This is the "return lack of access while a
  request is ongoing" requirement from the issue, for any consumer that reads state
  without awaiting.
- `syncForRoute(pageKey, hash)` — clears all cached/pending entries (`reset()`), records
  `pageKey`/`hash`, looks up `accessRouteConfig[pageKey]` (Step 3), and calls the
  matching `ensureX(...)` for each descriptor found, deriving params from `hash` via
  `BasePageController.extractParams`/`HashRouteResolver`. No-op (just resets) when the
  page requires no access check.
- `syncForAuthChange()` — aborts every in-flight controller, clears all cached entries,
  then re-runs `syncForRoute(pageKey, hash)` using the last-recorded route (covers
  "if an access request is ongoing, a login/logoff cancels it and starts a new one",
  and also refreshes already-resolved entries since a login/logout can change them).

### Step 3 — Add the route→access configuration

Create `frontend/assets/js/utils/accessRouteConfig.js`, a plain object keyed by the
`HashRouteResolver` page keys (the second argument of each `this.#router.register(...)`
call in `HashRouteResolver.js`), valued as an array of descriptors, e.g.:

```js
export default {
  game: [{ kind: 'game', pattern: '/games/:game_slug', params: ['game_slug'] }],
  gameEdit: [{ kind: 'game', pattern: '/games/:game_slug/edit', params: ['game_slug'] }],
  pcCharacter: [{
    kind: 'character', characterKind: 'pcs',
    pattern: '/games/:game_slug/pcs/:character_id', params: ['game_slug', 'character_id'],
  }],
  treasureEdit: [
    { kind: 'superuser' },
    { kind: 'treasure', pattern: '/treasures/:id/edit', params: ['id'] },
  ],
  staffUsers: [{ kind: 'staffOrSuperuser' }],
  // ... one entry per page key listed in "Files to Change" below, following the same
  // three shapes (game / character / treasure / superuser / staffOrSuperuser).
};
```

Populate one entry per page key that currently performs an access check (full list is
the "Pages" column of the migration table in Files to Change) using the matching
pattern already registered in `HashRouteResolver.js`. Page keys with no current access
check (e.g. `games`, `home`) get no entry.

### Step 4 — Thread `AbortSignal` through the client layer

Extend `BaseClient.getJson(path, token, extraHeaders, signal)` to accept an optional
trailing `signal` and pass it through to `request()`. Add the same optional trailing
`signal` parameter to `GameClient.fetchGameAccess`, `CharacterClient.fetchCharacterAccess`,
`TreasureClient.fetchTreasureAccess`, and `AuthClient.status` (used by `AdminAccess`,
which `AccessStore` now calls directly instead of going through `AdminAccess` — see
Step 5). Keep the parameter optional and last, so every existing non-access call site
is unaffected.

### Step 5 — Fold `AdminAccess` into `AccessStore`

`AccessStore.ensureSuperUser()`/`ensureStaffOrSuperUser()` reimplement
`AdminAccess.isSuperUser`/`isStaffOrSuperUser`'s logic directly (call `AuthClient.status`,
read `is_superuser`/`is_staff`, default `false` on non-ok or thrown error), now behind
the shared cache/dedupe/event machinery. Delete `AdminAccess.js` and its spec once
every caller (Step 7) is migrated — there is no other consumer of it.

### Step 6 — Wire `AccessStore` into routing and auth events

In `AppController.js`:
- Add an `AccessEvents`-independent call inside `buildEffect()`'s closure body (same
  function that currently builds `handleHashChange`): call
  `AccessStore.syncForRoute(this.getPage(), this.routeResolver.currentHash())` once up
  front (covers the initial mount, mirroring how `App.jsx`'s effect already calls
  `setPage(controller.getPage())` on mount), and again at the top of
  `handleHashChange`, right after `this.setPage(this.getPage())`.
- Subscribe to `AuthEvents` alongside the existing `LanguageEvents` subscription:
  `const handleAuthChange = () => AccessStore.syncForAuthChange();`, add/remove it in
  the same `eventTarget.addEventListener`/effect-cleanup block that already manages
  `LanguageEvents.subscribe`/`unsubscribe`.

### Step 7 — Migrate every existing caller

Four call-site patterns exist today; each is replaced by an `AccessStore.ensureX(...)`
(or `AccessStore.ensureSuperUser()`/`ensureStaffOrSuperUser()`) call in place of the
direct client/`AdminAccess` call, keeping each controller's existing control flow
(parallel-fetch-and-merge, gate-and-redirect, etc.) otherwise unchanged:

- **Merge-onto-resource** (`GameController.js#mergeAccess`, `GameEditController.js`,
  `CharacterController.js#fetchAndMergeAccess`/`handleAccessResponse`,
  `BaseCharacterPhotosController.js`, `BaseCharacterTreasuresController.js`,
  `BaseEditController.js#fetchWithAccess` and its callers `TreasureEditController.js`,
  `GameTreasureEditController.js`): replace the `gameClient.fetchGameAccess(...)` /
  `characterClient.fetchCharacterAccess(...)` / `treasureClient.fetchTreasureAccess(...)`
  call with `AccessStore.ensureGameAccess(gameSlug)` /
  `AccessStore.ensureCharacterAccess(characterKind, gameSlug, characterId)` /
  `AccessStore.ensureTreasureAccess(id)`, which already resolves to `{ can_edit }` (or
  the fail-closed default), so the existing `{ ...resource, ...access }` merge and
  `.catch()` fallback logic collapses to just awaiting the store instead of the client.
- **Gate-and-redirect on resource access** (`GameNpcNewController.js`,
  `GameSessionNewController.js`, `GameTreasureNewController.js`): replace
  `gameClient.fetchGameAccess(gameSlug, token).then(r => r.ok ? r.json() : {can_edit:
  false})` with `AccessStore.ensureGameAccess(gameSlug)`.
- **Gate-and-redirect on admin access** (`TreasuresController.js`,
  `TreasureNewController.js`, `StaffUsersController.js`, `StaffUserController.js`,
  `StaffUserEditController.js`): replace `AdminAccess.isSuperUser(this.authClient)` /
  `AdminAccess.isStaffOrSuperUser(this.authClient)` with
  `AccessStore.ensureSuperUser()` / `AccessStore.ensureStaffOrSuperUser()`. Drop the
  now-unused `authClient` constructor param/import where nothing else in the class uses
  it.
- **List-index conditional access** (`GameNpcsController.js`, `GamePhotosController.js`,
  `GameTasksController.js`, `GameTreasuresController.js`, `GameSessionsController.js`):
  same as merge-onto-resource, replacing `gameClient.fetchGameAccess(gameSlug, token)`
  with `AccessStore.ensureGameAccess(gameSlug)`.

Once every call site above is migrated, delete the now-unused `fetchGameAccess`,
`fetchCharacterAccess`, `fetchTreasureAccess` methods from `GameClient.js`,
`CharacterClient.js`, `TreasureClient.js` only if nothing else references them (confirm
with a repo-wide grep before removing — Step 4 keeps their signatures but callers move
into `AccessStore`).

## Files to Change

- `frontend/assets/js/utils/AccessEvents.js` — new, `access:changed` pub-sub (Step 1).
- `frontend/assets/js/utils/AccessStore.js` — new, the central access object (Step 2).
- `frontend/assets/js/utils/accessRouteConfig.js` — new, route→access config (Step 3).
- `frontend/assets/js/client/BaseClient.js` — add optional `signal` to `getJson` (Step 4).
- `frontend/assets/js/client/GameClient.js` — add optional `signal` to `fetchGameAccess` (Step 4).
- `frontend/assets/js/client/CharacterClient.js` — add optional `signal` to `fetchCharacterAccess` (Step 4).
- `frontend/assets/js/client/TreasureClient.js` — add optional `signal` to `fetchTreasureAccess` (Step 4).
- `frontend/assets/js/client/AuthClient.js` — add optional `signal` to `status` (Step 4).
- `frontend/assets/js/utils/AdminAccess.js` — delete once callers are migrated (Step 5).
- `frontend/assets/js/components/AppController.js` — wire route/auth sync (Step 6).
- Pages/controllers migrated to `AccessStore` (Step 7): `GameController.js`,
  `GameEditController.js`, `CharacterController.js`, `BaseCharacterPhotosController.js`,
  `BaseCharacterTreasuresController.js`, `BaseEditController.js`,
  `TreasureEditController.js`, `GameTreasureEditController.js`,
  `GameNpcNewController.js`, `GameSessionNewController.js`,
  `GameTreasureNewController.js`, `TreasuresController.js`, `TreasureNewController.js`,
  `StaffUsersController.js`, `StaffUserController.js`, `StaffUserEditController.js`,
  `GameNpcsController.js`, `GamePhotosController.js`, `GameTasksController.js`,
  `GameTreasuresController.js`, `GameSessionsController.js`.
- New specs mirroring the above under `frontend/specs/assets/js/...` (see Notes).

## Notes

- `AccessStore`'s dedupe-by-key `ensureX` behavior means a page that both pre-warms via
  `AppController`'s `syncForRoute` and calls `ensureX` again from its own controller
  effect only triggers one network request — verify this with a test asserting the
  underlying client is called exactly once per key per route.
- Existing tests for every migrated controller stub the relevant client
  (`gameClient`/`characterClient`/`treasureClient`/`authClient`) via constructor
  injection; after migration those stubs should instead inject or stub `AccessStore`
  (or the client `AccessStore` wraps, if the test suite prefers stubbing at the fetch
  boundary — follow whatever pattern the existing `*Spec.js` files for the migrated
  controller already use).
- Add `AccessEventsSpec.js`, `AccessStoreSpec.js`, and `accessRouteConfigSpec.js` under
  `frontend/specs/assets/js/utils/`, mirroring `AuthEventsSpec.js`/`LanguageEventsSpec.js`
  for the events class and `AdminAccessSpec.js` for the admin-check behavior now living
  in `AccessStore`.
- No backend or proxy changes are required — all consumed endpoints already exist.
- No CircleCI/GitHub Actions config was found in this repo, so CI commands are omitted;
  use the standard local commands instead: `docker-compose run --rm majora_fe yarn lint`
  and `docker-compose run --rm majora_fe yarn test`.
- Given the size (new store + config + 20 call sites), consider landing this as more
  than one PR (e.g. store + wiring first, then the mechanical per-controller migration)
  if that's preferable to a single large diff — this plan does not mandate one PR.

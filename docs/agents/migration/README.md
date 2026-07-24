# Mutation Migration: `RequestStore`

> **This document is temporary.** It exists only while the app-wide migration of
> mutation (`POST`/`PATCH`/`PUT`) requests onto `RequestStore` is in progress.
> Delete this file (and the `docs/agents/migration/` directory) once every
> route in the checklist below is checked off — do not archive it.

## Why this exists

`RequestStore` (`frontend/assets/js/utils/requests/RequestStore.js`) already
centralizes `GET` requests for game-related resources: permission-based URL
resolution, in-memory caching, and de-duplication of parallel requests for
the same resource/params/query. Historically, mutation requests
(`POST`/`PATCH`/`PUT`) did not go through it — each page resolved its own
mutation URL/permission via a resource `Client` class (or, in a few cases, a
raw `GenericClient` call against a hand-built path), duplicating logic
`RequestStore` already owns for reads, and leaving no way to invalidate the
`GET` cache after a successful mutation.

#830 introduced the migration path (PC edit, NPC edit, NPC new) and #841
extended it to a second batch (treasures, game items, character-owned items,
game-document create). Every future issue that migrates another route should
link to this document instead of re-deriving the approach, and should update
the checklist below as part of its own PR.

## The approach

- **Config**: each resource's `frontend/assets/js/utils/requests/config/*Config.js`
  file defines, per HTTP method and quantity type (`single`/`collection`, plus
  any resource-specific key such as `document`'s `gameCollection`), one or more
  path-resolution variants (e.g. `regular`/`private`) the same way `GET` already
  does. Adding a mutation is purely additive config — no `RequestStore`-level
  code changes are expected.
- **Dispatch**: controllers call `RequestStore.mutate({ componentName, resource,
  method, quantityType, params, body, variantName })` directly — there is no
  per-resource client method for the actual HTTP call; `RequestStore` dispatches
  through its own internal `RequestMutationClient`. Pass `variantName` explicitly
  whenever the caller already knows which variant applies from already-loaded
  data (e.g. `character.can_edit`), instead of re-resolving permissions
  redundantly.
- **Cache purge**: on a successful mutation, `RequestStore.purge({ resource })`
  clears that resource's cached (settled, not in-flight) `GET` data; an
  in-flight `GET` for that resource is aborted and restarted instead (the
  existing permission-changed-mid-flight mechanic). Cross-resource purges (a
  mutation on one resource invalidating another resource's cache, e.g. a photo
  upload invalidating its owning item/treasure's show/index data) are done
  manually at the call site today — `variant.purge` exists on the resolved
  config object and is consumed by `RequestStore.js`'s `#purgeAfterMutation`,
  but no config currently populates it; follow the manual call-site pattern
  unless a route's purge target genuinely differs from its own resource.
- **Photo upload has two call shapes**, both already precedent:
  - Synchronous, pre-render (existing-entity pages, e.g. `CharacterEdit.jsx`,
    `Treasures.jsx`, `GameItem.jsx`): `resourceConfig.get('POST', resource,
    'single').regular.path(params)`, handed to `PhotoUploadModal` as a plain
    string prop.
  - Asynchronous, post-create (new-entity pages, e.g. `GameNpcNewController.js`,
    `GameItemNewController.js`, `CharacterItemNewController.js`): `await
    RequestStore.resolvePath({ resource, method: 'POST', quantityType, params
    })`, handed to `PhotoUploadSaga#upload(uploadPath, ...)`.
  - In both shapes, the photo-upload-*init* endpoint is modeled as a
    `resolvePath`-only `POST` entry (used only to resolve the URL/permission,
    not routed through `RequestStore.mutate` itself, since the actual
    multipart request is owned by `UploadClient`/`PhotoUploadSaga`) — the
    upload's *completion* purges the owning resource's cache.
- **Mutations never participate in `GET`'s de-dupe/attach/cache mechanic** —
  each mutation is always its own request, never merged with another
  in-flight request or served from cache.
- **Specs**: `spyOn(RequestStore, 'mutate'/'resolvePath')` returning a plain
  object stand-in for `Response` (`{ ok, status, json: () =>
  Promise.resolve({...}) }`), asserting the full call args verbatim. `spyOn
  (RequestStore, 'purge')` (bare, call-tracking only), asserting it's called
  with the right `{ resource }` on success and not called on failure paths.

## Route checklist

### Migrated

- [x] PC edit (#830)
- [x] NPC edit (#830)
- [x] NPC new (#830)
- [x] `/#/treasures/new` (#841)
- [x] `/#/treasures/:id/edit` (#841)
- [x] `/#/treasures` photo upload (#841)
- [x] `/#/games/:game_slug/treasures/new` (#841)
- [x] `/#/games/:game_slug/treasures/:treasure_id/edit` (#841)
- [x] `/#/games/:game_slug/items/new` (#841)
- [x] `/#/games/:game_slug/items/:id/edit` (#841)
- [x] `/#/games/:game_slug/items/:id` photo upload (#841)
- [x] `/#/games/:game_slug/documents/new` (#841)
- [x] `/#/games/:game_slug/pcs/:character_id/items/new` (#841)
- [x] `/#/games/:game_slug/pcs/:character_id/items/:id/edit` (#841)
- [x] `/#/games/:game_slug/pcs/:character_id/items/:id` photo upload (#841)
- [x] `/#/games/:game_slug/npcs/:character_id/items/new` (#841)
- [x] `/#/games/:game_slug/npcs/:character_id/items/:id/edit` (#841)
- [x] `/#/games/:game_slug/npcs/:character_id/items/:id` photo upload (#841)
- [x] `/#/games/new` (#844)
- [x] `/#/games/:game_slug/edit` (#844)
- [x] `/#/games/:game_slug/photos` (upload) (#844)
- [x] `/#/games/:game_slug/pcs/:character_id/items` and `/#/games/:game_slug/npcs/:character_id/items`
  (exchange modal — acquire/remove item) (#844)
- [x] `/#/games/:game_slug/pcs/:character_id/treasures` and `/#/games/:game_slug/npcs/:character_id/treasures`
  (exchange modal — acquire/remove/buy/sell treasure) (#844)
- [x] `/#/games/:game_slug/pcs/:character_id/photos` and `/#/games/:game_slug/npcs/:character_id/photos`
  (set profile photo + upload) (#844)
- [x] `/#/games/:game_slug/treasures` photo upload (#844)

### Not yet migrated

**Game Session**
- [ ] `/#/games/:game_slug/sessions/new` — `GameSessionNewController.js` → `GameSessionClient.createSession`
- [ ] `/#/games/:game_slug/sessions/:id/edit` — `GameSessionEditController.js` → `GameSessionClient.updateSession`
- [ ] `/#/games/:game_slug/sessions/:id` (message post) — `SessionMessagesController.js` → `GameSessionClient`
- [ ] `/#/games/:game_slug/sessions/:id` (poll proposal) — `GameSessionController.js` → `GameSessionClient.createSessionPoll`

**Poll**
- [ ] `/#/games/:game_slug/polls/new` — `GamePollNewController.js` → `PollClient.createPoll`
- [ ] `/#/games/:game_slug/polls/:id` (vote cast) — `GamePollController.js` → `PollClient.castPollVotes`
- [ ] `/#/games/:game_slug/polls` (close modal) — `PollCloseModalController.js` → `PollClient.closePoll`

**Game Task**
- [ ] `/#/games/:game_slug/tasks` (create/update/toggle-complete) — `GameTasksController.js` → `GameTaskClient.createTask`/`updateTask`

**Character slain toggle**
- [ ] `/#/games/:game_slug/npcs/:character_id` and `/#/games/:game_slug/npcs` — `SlainConfirmController.js`/`PlayerSlainConfirmController.js` → `CharacterClient.setNpcSlain`/`setNpcPublicSlainAsPlayer`

**Treasure (link existing)**
- [ ] `/#/games/:game_slug/treasures` (Add Treasure modal) — `AddGameTreasureModalController.js` → `TreasureClient.linkGameTreasure`

**Staff User**
- [ ] `/#/staff/users/:id/edit` — `StaffUserEditController.js` → `StaffUserClient.updateUser`
- [ ] `/#/staff/users/:id` (generate recovery link) — `StaffUsersController.js`/`StaffUserController.js` → `StaffUserClient.fetchRecoveryLink`

**Confirmed no create/update UI (nothing to migrate)**
- Player — no create/edit route exists.
- PC creation — no standalone "new" page exists.
- Game Document edit — only create exists; no edit route/UI.
- Game Links — show-only, no create/edit UI.
- Character Links — edited inline as part of the already-migrated (#830) PC/NPC full-record edit save; no client of its own.
- Photo model — no standalone create/edit page; only the resource-scoped upload/set-profile endpoints listed above.

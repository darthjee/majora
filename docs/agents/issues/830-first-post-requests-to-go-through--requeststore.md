# Issue: First post requests to go through `RequestStore`

## Description
Most `GET` requests for game-related resources (`game`, `npc`, `pc`, `item`, `treasure`, `session`, `document`) already go through `RequestStore` (`frontend/assets/js/utils/requests/RequestStore.js`), which centralizes permission-based URL resolution, in-memory caching, and de-duplication of parallel requests for the same resource/params/query.

`POST`, `PATCH`, `PUT`, and `DELETE` (mutation) requests do not go through it yet.

## Problem
- Components issuing mutation requests still need to know which URL/permission variant to use themselves, duplicating logic `RequestStore` already centralizes for `GET`.
- Mutations change the data behind `show`/`index` responses, but `RequestStore`'s in-memory `GET` cache has no way to know a mutation happened, so it can keep serving stale cached data after a mutation succeeds. (The backend `tent` proxy already handles the equivalent cache invalidation; the frontend store does not yet.)

## Expected Behavior
- `POST`, `PATCH`, `PUT`, `DELETE` requests for the PC and NPC resources go through `RequestStore`, resolving the correct URL/permission variant the same way `GET` requests already do.
- After a mutation completes, `RequestStore`'s cached (already-settled, not in-flight) `GET` data for the affected resource(s) is purged so the next `GET` reflects the mutation. A mutation can be configured to purge other resources' cache too (e.g. an NPC photo upload also purging that NPC's own show/index cache, since the mutation is a photo-upload endpoint rather than a direct PATCH to the NPC).
- If a `GET` request is in flight for a resource when a mutation for that resource lands, the in-flight `GET` is aborted and a new one is started (reusing the existing "permission changed mid-flight" abort-and-restart mechanic), so its caller still receives a response, and that response is guaranteed fresh.
- Mutation requests never participate in the `GET` de-dupe/attach mechanic — each mutation is always its own request, never merged with another in-flight request or served from cache.
- Scope for this issue is limited to the five listed PC/NPC pages below (PC show/edit, NPC new/show/edit); other pages keep using their current (non-`RequestStore`) mutation path until a follow-up issue migrates them.

## Solution
Extend `RequestStore`/`resourceConfig` so `POST`, `PATCH`, `PUT`, `DELETE` are configured and dispatched the same way `GET` is today, and so the in-memory cache is purged on mutation.

### Configuration
Add `POST`/`PATCH`/`PUT` entries to the resource configs, alongside the existing `GET` entries:
- `frontend/assets/js/utils/requests/config/pcConfig.js`
- `frontend/assets/js/utils/requests/config/npcConfig.js`

(`resourceConfig.js` already anticipates this: each resource file is keyed by HTTP method first, with only `GET` populated today, specifically so other methods can be added later without restructuring.) New configuration files can be introduced if the existing two aren't the right shape for a given mutation (e.g. the shared photo-upload mutation).

The full-editor update mirrors `GET`'s `regular`/`private` variant shape for both PC and NPC (backend routes both `.../pcs/:id.json` and `.../npcs/:id.json` as the shared "detail" route, `.../pcs|npcs/:id/full.json` as "full"):
- `private` (`full.json`, `can_edit`-gated) is the variant actually used by both edit pages' full-editor submit today.
- `regular` (plain `.json`) already accepts a narrow player-writable `PATCH` for NPCs (`npc_player_update`, the reduced description/allegiance/slain/links field set, wired today as `CharacterClient#updateNpcAsPlayer`). For PCs the same plain `.json` route only supports `GET` on the backend today (no PC-player PATCH exists yet) — model the config symmetrically anyway, reserving the `regular` PC variant for a future issue that adds player-writable PC updates; no PC caller reaches it yet since the edit page redirects away when `!can_edit`.

### Cache deletion
`RequestStore` holds a collection of `Request` objects (`frontend/assets/js/utils/requests/Request.js`); each may be ongoing (in flight) or already settled (holding cached data).

When a mutation (`POST`/`PATCH`/`PUT`) arrives for a resource:
- Any settled `Request` for that resource is deleted, since a settled entry is exactly the "cache" that must no longer be served after the mutation.
- Any ongoing `Request` for that resource is **not** purged outright (a caller is already waiting on it) — instead its in-flight HTTP request is dropped and a new one is started, reusing the existing permission-change abort-and-restart mechanic. This guarantees the waiting caller still gets a response, and that the response is fresh rather than answering with data that predates the mutation.

#### Cross-resource cache deletion
Some mutations must also purge cache for a *different* resource — e.g. an NPC photo upload changes the NPC's photo URL, so the NPC's `show`/`index` cache must be purged as if it were itself a `PATCH` to the NPC. Support this by extending the mutation resource configuration with a list of other resources whose cache should also be purged on that mutation.

### Request attachment and cache bypass
For `GET`, a new request for the same resource/filters/params that matches an already ongoing-or-settled request attaches to that existing promise (or an already-resolved one) instead of firing a new HTTP request — this is the in-memory cache/de-dupe mechanic.

Mutation requests must bypass this mechanic entirely: each one always fires its own HTTP request and is never deduped against, or served from, another request.

### Components involved (implemented pages)
- PC show page (`/#/games/:game_slug/pcs/:id`)
- PC edit page (`/#/games/:game_slug/pcs/:id/edit`)
- NPC new page (`/#/games/:game_slug/npcs/new`)
- NPC show page (`/#/games/:game_slug/npcs/:id`)
- NPC edit page (`/#/games/:game_slug/npcs/:id/edit`)

There is no PC "new" page in this app today (only NPCs have one, at the route above) — PCs are created elsewhere, so that page is out of scope.

Shared components touched by the above:
- **Photo upload** (`components/common/modals/PhotoUploadModal.jsx` + `PhotoUploadModalController.js`, backed by `UploadClient.js`), fully shared between PC and NPC (parameterized by upload path). Also reused by `PhotoUploadSaga.js` for the NPC-new and character-item-new flows.
- **Money edit** (`components/common/modals/MoneyEditModal.jsx` + `MoneyEditModalController.js`), fully shared between PC and NPC. Note this is two different mutation flows today: the **show page** persists money immediately on modal confirm (`CharacterClient#updateCharacterMoney`, `PUT .../money.json`); the **edit page** only stages the value in local form state, persisted later as part of the full-form `PATCH .../full.json` save. Both flows are in scope.

Migrating a shared component to `RequestStore` is fine even when it "leaks" into other, not-yet-migrated pages (e.g. `PhotoUploadSaga`'s item-new flow) — we don't need to fully migrate every page reached this way, only make sure whichever leaked-into page keeps using the correct resource configuration.

### Endpoints affected
Endpoints below reflect the current frontend/backend code, corrected against the endpoints originally listed on this issue (some assumed a `regular`/`restricted` pair that doesn't actually exist on the backend, or a different path than what's actually called):

- **Update PC (full editor)** — `PATCH /games/:game_slug/pcs/:id/full.json` (`can_edit`: admin, dm, owner). No PC counterpart to NPC's player-writable endpoint exists on the backend yet (see Configuration above).
- **Update PC Money** — `PUT /games/:game_slug/pcs/:id/money.json` (show page); folded into the full-editor `PATCH` above (edit page).
- **PC photo upload** — `POST /games/:game_slug/pcs/:id/photo_upload.json`, then `POST /uploads/:id/submit` (generic, no PC/NPC-specific path or `.json` suffix — corrects the issue's original `/upload/:id/submit.json`).
- **PC photo set-roles** (e.g. marking the profile photo) — `PATCH /games/:game_slug/pcs/:id/photos/:photo_id/set.json`. Not in the issue's original endpoint list; added per scope decision above.
- **Create NPC** — `POST /games/:game_slug/npcs.json` (admin, dm, staff, player). There is no restricted/full variant of this endpoint on the backend today, unlike the issue's original table assumed.
- **Update NPC (full editor)** — `PATCH /games/:game_slug/npcs/:id/full.json` (`can_edit`: admin, dm).
- **Update NPC (player-writable)** — `PATCH /games/:game_slug/npcs/:id.json` (any player of the game, plus admin/dm), narrower field set (description/allegiance/slain/links only).
- **Update NPC Money** — `PUT /games/:game_slug/npcs/:id/money.json` (show page); folded into the full-editor `PATCH` above (edit page).
- **NPC photo upload** — `POST /games/:game_slug/npcs/:id/photo_upload.json`, then `POST /uploads/:id/submit` (generic, same note as PC above).
- **NPC photo set-roles** — `PATCH /games/:game_slug/npcs/:id/photos/:photo_id/set.json`. Not in the issue's original endpoint list; added per scope decision above.

### Partial implementation
Only the five pages listed above (PC show/edit, NPC new/show/edit) are migrated in this issue, to validate the approach before migrating the rest of the app in future issues/PRs.

## Benefits
- Components no longer need to duplicate permission-to-URL resolution logic for mutations — `RequestStore` centralizes it, same as it already does for `GET`.
- `GET` responses can no longer go stale after a mutation, without giving up the in-memory cache/de-dup benefits reads get from `RequestStore`.
- Validates the migration approach on a small slice (PC/NPC show/edit + NPC new) before rolling it out to the rest of the app.

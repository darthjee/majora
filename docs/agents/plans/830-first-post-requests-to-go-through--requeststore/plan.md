# Plan: First post requests to go through `RequestStore`

Issue: [830-first-post-requests-to-go-through--requeststore.md](../issues/830-first-post-requests-to-go-through--requeststore.md)

## Overview

Extend the `utils/requests/` layer (`RequestStore`, `Request`, `resourceConfig`) — today `GET`-only — so mutation requests (`PATCH`/`PUT`/`POST`) for the `pc`/`npc` resources resolve their URL/permission the same way `GET` does, and so a successful mutation purges (or, for an in-flight `GET`, aborts-and-restarts) the affected `Request`(s) held by `RequestStore`, instead of leaving them serving stale cached data. Rewire the five in-scope pages (PC show/edit, NPC new/show/edit) and their shared modals (photo upload, money edit, photo set-roles) onto this new path. This is a frontend-only change; no backend or other specialist agent has work here.

## Context

`RequestStore`/`Request`/`resourceConfig` (issue #778) already centralize `GET` — permission-based URL resolution, in-memory caching, dedupe of parallel requests for the same resource/quantityType/params/query. `POST`/`PATCH`/`PUT` requests bypass all of this today: components call `CharacterClient`/`UploadClient` (raw `fetch` wrappers) directly, and because `RequestStore`'s `GET` cache has no way to know a mutation happened, a page that already GET-migrated (e.g. any page using `CharacterController.loadCharacter`) would start serving **stale** cached data after a mutation, once mutations are naively added elsewhere — this is the core bug this issue closes.

Key facts established while investigating (see the issue file's "Endpoints affected" section for the full, corrected list):
- `resourceConfig.js`'s per-resource config files are already keyed by HTTP method first (`GET` only populated today) specifically so `POST`/`PATCH`/`PUT` can be added without restructuring.
- The full-editor update (`BaseCharacterEditController#handleSubmit`) always PATCHes `.../full.json` today; there is no PC "regular" (plain `.json`) PATCH yet on the backend (`game_pc_detail` only supports `GET`), while NPC's plain `.json` route already supports a narrower player-writable `PATCH` (`npc_player_update`, wired as `CharacterClient#updateNpcAsPlayer`). Per the issue's confirmed scope, `pcConfig`/`npcConfig`'s mutation entries should still mirror `GET`'s `regular`/`private` shape symmetrically (reserving the PC `regular` variant for a future issue), not treat PC/NPC asymmetrically.
- Money persists two different ways depending on page: the **show page** fires `PUT .../money.json` immediately on modal confirm (`CharacterController#updateCharacterMoney`); the **edit page** only stages the value in local form state, persisted later as part of the full-form `PATCH .../full.json` save. Both need migrating, but the edit-page one requires no separate mutation call — it's already covered by the full-editor `PATCH` once that goes through `RequestStore`.
- Photo upload is a two-step saga (`UploadClient#initUpload` → resource-scoped, permission-gated `POST .../photo_upload.json`; then `UploadClient#submitUpload` → generic, non-resource-scoped `POST /uploads/:id/submit`, no `.json` suffix). Only the first step has a `resourceConfig`-shaped path/permission; the cache purge must fire after the **whole saga** succeeds, not after the first step.
- Photo set-roles (`CharacterController#setProfilePhoto`, backed by `CharacterClient#setPhotoRoles`, `PATCH .../photos/:photo_id/set.json`) is in scope per the issue's confirmed decision, alongside the photo-upload endpoints.
- **Important existing-behavior trap**: `CharacterDetail.jsx`'s `handleUploadSuccess`/`handleMoneyConfirm`/`handleSetProfilePhoto` and `CharacterEdit.jsx`'s `handleUploadSuccess` already call `controller.buildEffect()()` (i.e. `RequestStore.ensure(...)`) right after a mutation succeeds, to refresh the page. Once the initial `GET` goes through `RequestStore`, that refetch will silently **re-serve the stale cached value** unless the mutation's cache purge runs first. Every mutation call site must purge before (or as part of) triggering that refetch.

## Implementation Steps

### Step 1 — Extend `Request`/`RequestStore` with mutation dispatch + cache invalidation

Add to `frontend/assets/js/utils/requests/Request.js`:
- A way to tell whether the `Request` is currently in flight vs. settled (e.g. expose `isOngoing()` — the existing private `#promise` field is non-null exactly while a fetch is pending, per `#settle` resetting it to `null`).
- A way to force a restart for the *same* key without discarding already-handed-out promises — distinct from `abort()` (which discards `#promise`/`#resolve`, appropriate for `RequestStore.reset()`, not for this). Reset `#activeKey` to `null` and reset the private `AccessCache` (aborting the in-flight fetch), but keep `#promise`/`#resolve` so a caller already waiting on this `Request` still resolves once the *replacement* fetch settles. Mirrors the existing permission-change abort-and-restart mechanic already described in `Request`'s class doc.

Add to `frontend/assets/js/utils/requests/RequestStore.js`:
- `purge({ resource, params })` (naming flexible) — iterate the held `requests` Map for every entry whose `resource` matches (regardless of `quantityType`/params, since e.g. an NPC update must purge both that NPC's `single` cache *and* the `npc` `collection`/index cache): delete the entry outright when its `Request` is settled; when ongoing, call the new restart method and re-trigger it via the same resolve-permissions-then-`ensure()` pattern `resyncPermissions()` already uses per-entry (so the fetch actually restarts, not just goes idle).
- `mutate({ componentName, resource, method, quantityType, params, query, body, purge })` (naming flexible) — the mutation counterpart to `ensure()`: resolve permissions via `RequestPermissionResolvers` (reused as-is), resolve the `regular`/`private` path variant via `resourceConfig.get(method, resource, quantityType)`, fire the HTTP call (see Step 2), and on success call `purge` for `resource` and every resource listed in the resolved config's cross-resource purge list (see Step 2). Must bypass the `GET` dedupe/cache mechanic entirely — always fire a fresh HTTP request, never attach to or serve from another `Request`.

### Step 2 — Extend `resourceConfig`/`RequestClient` for mutation methods

`frontend/assets/js/utils/requests/resourceConfig.js` already keys each resource file by method first — no structural change needed there, only new entries in the per-resource files.

`frontend/assets/js/utils/requests/config/pcConfig.js` / `npcConfig.js` — add, alongside the existing `GET` key:
- `PATCH.single` — `{ regular, private }`, mirroring `GET.single`'s shape: `private` → `.../full.json` (`can_edit`), `regular` → plain `.../:id.json` (for NPC, wire the field-set distinction described in Context; for PC, point at the same plain path even though it 404s/405s on the backend today — no PC caller reaches it yet, matching the confirmed scope decision).
- `PUT.single` — money endpoint (`.../money.json`), single un-branched variant (no permission split observed in `CharacterClient#updateCharacterMoney` today).
- `PATCH` entry for photo set-roles (`.../photos/:photo_id/set.json`) — needs a `photo_id` param in addition to `id`; model it under whatever `quantityType`-like key keeps the shape consistent with the rest of the file (e.g. a dedicated key, following `treasureConfig.js`'s precedent for params-dependent config).
- `POST.single` for photo upload init (`.../photo_upload.json`) — used only to resolve the init step's path (see Step 3); cross-resource `purge` list on both the money/full-editor/photo-set-roles/photo-upload entries should include the *other* resource for cases like NPC photo upload also needing the NPC's own show/index purged (re-read the issue's "Cross resource cache deletion" section — confirm with the issue author only if the actual cross-resource case turns out broader than self-purge once implementing; today's known case is same-resource, so this may end up being a no-op list for pc/npc specifically, but keep the config shape generic).
- `npcConfig.js` only — `POST.collection` for NPC creation (`/games/:game_slug/npcs.json`, single un-branched variant — confirmed no restricted/full variant exists on the backend).

`frontend/assets/js/utils/requests/RequestClient.js` (or a new sibling, e.g. `RequestMutationClient.js`, if keeping `RequestClient` `GET`-only reads cleaner) — add a method to fire a non-`GET` request against an already-resolved path with a JSON body, returning parsed JSON + response status/ok the same way callers need today (`response.ok`, `response.status === 400` field-error handling, `response.json()`), reusing `BaseClient`'s existing `patchJson`/`putJson`/`postJson` helpers.

### Step 3 — Rewire the five in-scope pages' mutation call sites

- `frontend/assets/js/components/resources/character/pages/controllers/CharacterController.js` — `updateCharacterMoney` and `setProfilePhoto` call `RequestStore.mutate(...)` instead of `characterClient.updateCharacterMoney`/`setPhotoRoles` directly, purging `pc`/`npc` (`this.#resourceName()`) on success.
- `frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterEditController.js` — `handleSubmit` calls `RequestStore.mutate(...)` for both the full-editor and player-writable branches, purging on success before `#handleResponse` redirects.
- `frontend/assets/js/components/resources/character/pages/controllers/GameNpcNewController.js` — `submitForm`'s `createNpc` call goes through `RequestStore.mutate(...)` (`POST`, `collection`), purging the `npc` collection cache on success (so the new NPC shows up in any already-cached NPC list); `#uploadPhoto` (used by both the initial submit's photo step and `retryPhotoUpload`) purges the `npc` `single` cache for the created id after the upload saga succeeds, using `RequestStore`'s purge method directly (the saga's second step is generic and outside `resourceConfig`'s per-resource shape — see Step 2's note).
- `frontend/assets/js/components/resources/character/pages/shared/CharacterDetail.jsx` / `CharacterEdit.jsx` — resolve the photo-upload init path via `resourceConfig`/`RequestStore` instead of building the literal template string inline, and make sure `handleUploadSuccess`/`handleMoneyConfirm`/`handleSetProfilePhoto`'s existing `controller.buildEffect()()` refetch actually sees purged cache (i.e. purge must complete, in the `.then()` chain, before that refetch call — see Context's "existing-behavior trap").
- `frontend/assets/js/components/common/modals/controllers/PhotoUploadModalController.js` / `frontend/assets/js/components/common/base/controllers/PhotoUploadSaga.js` — keep the two-step `init`/`submit` orchestration as-is (it's shared beyond PC/NPC), but source the init call's path/permission resolution from `RequestStore`/`resourceConfig` at the call site (Step 3's page-level changes) rather than changing these shared classes' own signatures, unless a cleaner shared abstraction becomes obvious while implementing.

### Step 4 — Tests

Add/extend Jasmine specs under `frontend/specs/utils/requests/` for the new `Request`/`RequestStore` behavior (ongoing-vs-settled purge, restart-preserves-already-handed-out-promise, mutation bypassing dedupe) and under `frontend/specs/utils/requests/config/` for the new `pcConfig`/`npcConfig` entries, mirroring existing spec structure. Update specs under `frontend/specs/components/resources/character/pages/controllers/` for every controller touched in Step 3 (mirror `assets/js/` structure, per `docs/agents/frontend.md`'s Tests section).

## Files to Change

- `frontend/assets/js/utils/requests/Request.js` — add ongoing/settled introspection + restart-preserving-promise method.
- `frontend/assets/js/utils/requests/RequestStore.js` — add `mutate()`/`purge()`.
- `frontend/assets/js/utils/requests/RequestClient.js` (or new sibling) — add non-`GET` dispatch.
- `frontend/assets/js/utils/requests/config/pcConfig.js` — add `PATCH`/`PUT`/`POST` entries.
- `frontend/assets/js/utils/requests/config/npcConfig.js` — add `PATCH`/`PUT`/`POST` entries, incl. `POST.collection` for creation.
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterController.js` — `updateCharacterMoney`, `setProfilePhoto`.
- `frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterEditController.js` — `handleSubmit`.
- `frontend/assets/js/components/resources/character/pages/controllers/GameNpcNewController.js` — `submitForm`, `#uploadPhoto`.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterDetail.jsx` — upload path resolution, purge-before-refetch ordering.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterEdit.jsx` — upload path resolution, purge-before-refetch ordering.
- New/updated spec files under `frontend/specs/utils/requests/` and `frontend/specs/components/resources/character/pages/controllers/` mirroring every file above.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe yarn coverage` (CI job: `jasmine`)

## Notes

- `BaseCharacterPhotosController#setProfilePhoto` (used by the separate, standalone PC/NPC "Photos" index page — not one of this issue's five in-scope pages) is intentionally **not** migrated here; it keeps calling `CharacterClient#setPhotoRoles` directly. Leave it as-is unless implementing reveals it shares enough code with `CharacterController#setProfilePhoto` to trivially migrate alongside it (the issue's own "leak implementation" note permits this either way).
- The "Cross resource cache deletion" mechanic (a mutation purging a *different* resource's cache) has no concrete pc/npc example in this issue's five pages today — build the config shape to support a purge list, but don't force a fabricated cross-resource example into `pcConfig`/`npcConfig` if none actually applies once implementing.
- `pcConfig`'s new `PATCH.single.regular` variant points at a backend route that only supports `GET` today (see Context) — this is intentional, per the confirmed scope decision to reserve it for a future player-PC-editing issue; do not add backend `PATCH` support as part of this issue.
- Verify the exact permission gating for photo upload/set-roles endpoints against `docs/agents/access-control.md` while wiring `resourceConfig` entries for them, since the issue only asked to *revalidate*, not change, existing permissions.

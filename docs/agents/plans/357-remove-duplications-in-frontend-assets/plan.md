# Plan: Remove duplications in frontend/assets

Issue: [357-remove-duplications-in-frontend-assets.md](../issues/357-remove-duplications-in-frontend-assets.md)

## Overview

Consolidate three independent pockets of duplication in `frontend/assets/js`, entirely within the `frontend` agent's scope: (1) the PC/NPC Photos/Treasures/detail page trio, following the existing `CharacterEdit`/`BaseCharacterEditController`/`BaseCharacterEditHelper` pattern already used for the Edit pages; (2) repeated auth/JSON header boilerplate in `client/*.js`, via new shared helpers on `BaseClient.js`; and (3) the repeated Edit-page controller skeleton across 5 unrelated entities, via a parameterized base controller. Jasmine spec *rewriting* is out of scope, but specs must keep passing (or be updated minimally to match new call signatures) since production code they exercise is changing shape.

## Context

`frontend/assets` contains near-byte-identical pc/npc file pairs, ~80 occurrences of hand-built request headers in API clients, and 5 structurally identical Edit-page controllers. This mirrors the backend duplication cleanup done in #355/#356, scoped here to the frontend. Verified during exploration:

- `components/pages/{Npc,Pc}Character{Photos,Treasures}.jsx` + their `controllers/` + `helpers/{Npc,Pc}CharacterPhotosHelper.jsx` differ only in the `'npcs'`/`'pcs'` literal, i18n key prefixes, and naming — confirmed via diff.
- `components/pages/{Npc,Pc}Character.jsx` (detail pages) are otherwise identical except NPC adds `SlainConfirmModal`/`SlainConfirmController` and a `showSlainModal` state — confirmed via diff.
- The Edit pair already solved this via `components/pages/shared/CharacterEdit.jsx` (prop-driven: `ControllerClass`, `getParamsFromHash`, `EditHelper`, `characterKind`) + `BaseCharacterEditController`/`BaseCharacterEditHelper` — this is the pattern to replicate.
- `client/GameClient.js`, `TreasureClient.js`, `StaffUserClient.js`, `CharacterClient.js`, `GameSessionClient.js`, `AuthClient.js`, `GenericClient.js` each hand-build `{ Accept, Authorization, 'Content-Type' }` headers and `JSON.stringify(fields)` bodies inline on top of `BaseClient.request()` — confirmed in `GameClient.js`.
- `CharacterClient.js` has 13 pc/npc public method pairs (e.g. `fetchPc`/`fetchNpc`, `updatePc`/`updateNpc`) that already delegate to de-duplicated private helpers (`#fetchCharacter`, `#updateCharacter`, etc.) taking a `segment` argument — only the public surface needs consolidating.
- `GameEditController.js`, `TreasureEditController.js`, `GameSessionEditController.js`, `StaffUserEditController.js`, `GameTreasureEditController.js` share an identical `buildEffect()`/`#fetchXWithAccess()`/`submitForm()`/`#handleResponse()` skeleton — confirmed by reading `GameEditController.js` and `TreasureEditController.js` (the latter adds an `AdminAccess.isSuperUser` gate before proceeding).

## Implementation Steps

### Step 1 — Shared base for Photos/Treasures/detail pc/npc pages

1. Add `components/pages/shared/CharacterPhotos.jsx`, mirroring the prop-driven pattern of `shared/CharacterEdit.jsx` (props: `ControllerClass`, `getParamsFromHash`, `PhotosHelper`, `characterKind`), and a `BaseCharacterPhotosController` (parallel to `BaseCharacterEditController`) plus a `BaseCharacterPhotosHelper` (parallel to `BaseCharacterEditHelper`) under `controllers/`/`helpers/`, parameterized by `characterKind` (`'pcs'`/`'npcs'`) for URL segments and i18n key prefixes (`pc_character_photos_page.*`/`npc_character_photos_page.*`).
2. Reduce `NpcCharacterPhotos.jsx`/`PcCharacterPhotos.jsx`, their controllers, and their helpers to thin wrappers instantiating the shared base with the right `characterKind`, exactly as `NpcCharacterEdit.jsx`/`PcCharacterEdit.jsx` do today for `CharacterEdit.jsx`.
3. Repeat the same shared-base extraction for the Treasures pair (`{Npc,Pc}CharacterTreasures.jsx` + controllers) — reuse `CharacterTreasuresHelper.jsx`, which is already shared, and confirm whether a base controller is needed or whether the existing helper sharing already covers it; only extract what is actually duplicated.
4. For the detail page pair (`NpcCharacter.jsx`/`PcCharacter.jsx`), extract a shared base (e.g. `shared/CharacterDetail.jsx` + a base controller) that covers the common state/effect/render flow, with an explicit extension point (e.g. an `extraModals`/`onSlainAction` prop or a render-prop slot) so the NPC-only `SlainConfirmModal`/`SlainConfirmController` plugs in without forcing PC to carry unused slain logic — do not fake symmetry.
5. Keep i18n keys and URL segments identical to current behavior; only file layout and code structure change.

### Step 2 — Shared header helpers on `BaseClient.js`

1. Add `getJson(path, token)`, `postJson(path, token, fields)`, and `patchJson(path, token, fields)` (names illustrative — match whatever reads cleanest given `request()`'s existing signature) to `BaseClient.js`, each building the `Accept`/`Authorization`/`Content-Type` headers and, for writes, `JSON.stringify(fields)` internally, while preserving any per-call header overrides currently done ad hoc (e.g. `CharacterClient.js`'s conditional `X-Skip-Cache` header on some GETs — make sure the new helper still allows passing extra headers through, e.g. an `extraHeaders` param).
2. Migrate `GameClient.js`, `TreasureClient.js`, `StaffUserClient.js`, `GameSessionClient.js`, `AuthClient.js`, and `GenericClient.js` method-by-method to the new helpers, preserving exact request paths, methods, and behavior (verify via existing Jasmine specs for each client).
3. Migrate `CharacterClient.js`'s private helpers (`#fetchCharacter`, `#updateCharacter`, `#setPhotoRoles`, `#fetchTreasuresPage`, `#postTreasureAction`, `setNpcSlain`, `createNpc`, `fetchNpcsAll`) to the same shared helpers, taking care to keep the existing conditional `X-Skip-Cache` header logic (segment-and-suffix-dependent) intact.
4. Do not change any externally observable HTTP request (method, path, headers, body) — this step is a pure internal refactor.

### Step 3 — Collapse `CharacterClient.js` pc/npc public method pairs

1. Replace the 13 pc/npc method pairs with parameterized methods taking a `characterKind` (`'pcs'`/`'npcs'`) argument (e.g. `fetchCharacter(kind, gameSlug, characterId, token)` instead of `fetchPc`/`fetchNpc`), consistent with how the backend consolidated its own pc/npc pairs in #355/#356. Keep `createNpc`/`fetchNpcsAll`/`setNpcSlain` as-is if they have no PC counterpart (asymmetric, no pair to collapse).
2. Update every call site across page controllers (`NpcCharacterController.js`, `PcCharacterController.js`, `NpcCharacterPhotosController.js`, `PcCharacterPhotosController.js`, `NpcCharacterTreasuresController.js`, `PcCharacterTreasuresController.js`, `NpcCharacterEditController.js`, `PcCharacterEditController.js`, and any treasure-exchange-modal controller using `acquirePcTreasure`/`acquireNpcTreasure`/`sellPcTreasure`/`sellNpcTreasure`/`fetchPcTreasuresPage`/`fetchNpcTreasuresPage`) to call the new parameterized methods with the base controllers/pages from Step 1 supplying `characterKind` — this should collapse naturally since Step 1 already threads `characterKind` through.
3. Update or add Jasmine specs for `CharacterClient.js` to cover the new parameterized methods; existing specs referencing the old `fetchPc`/`fetchNpc`-style names must be updated to keep passing (spec updates here are a necessary consequence of the API change, not new test authoring — consistent with the issue's "test files out of scope" meaning no test-only duplication work, not "do not touch tests at all").

### Step 4 — Shared base for the 5 Edit-page controllers

1. Extract a `BaseEditController` (or similarly named) class covering: mount-guard + `safeSet` via `buildSafeSetter()`, a parameterized `#fetchWithAccess()` (parallel fetch of resource + access via `Promise.all`, tolerant `access` failure defaulting to `{ can_edit: false }`), `submitForm()` calling an injected client method then handling the response (redirect on success, field errors on 400, generic error otherwise), and an optional pre-effect hook (e.g. `beforeFetch(safeSet)` returning a boolean/promise) so `TreasureEditController`'s `AdminAccess.isSuperUser` gate plugs in without forcing that check onto the other 4 controllers.
2. Refactor `GameEditController.js`, `TreasureEditController.js`, `GameSessionEditController.js`, `StaffUserEditController.js`, and `GameTreasureEditController.js` to extend the new base, passing entity-specific pieces (client instance/methods, hash-param extractor, redirect path builder, submit field mapping) as constructor args or overridden hook methods — keep `TreasureEditController`'s superuser gate as the one controller using the extension hook.
3. Preserve every controller's existing public method names (`get*FromEditHash`, `submitForm`, constructor signature) so the corresponding page components (`GameEdit.jsx`, `TreasureEdit.jsx`, etc.) need no changes.

### Step 5 — Verify

Run the full frontend dev cycle after each step (or at minimum after Steps 3 and 4, which touch public signatures): lint and the full Jasmine suite, fixing any spec that references old method/file names.

## Files to Change

- `frontend/assets/js/components/pages/shared/CharacterPhotos.jsx` (new) — shared Photos page component, parallel to `shared/CharacterEdit.jsx`.
- `frontend/assets/js/components/pages/shared/CharacterDetail.jsx` (new, name illustrative) — shared detail page component with an NPC-only slain-modal extension point.
- `frontend/assets/js/components/pages/controllers/BaseCharacterPhotosController.js` (new) — parallel to `BaseCharacterEditController.js`.
- `frontend/assets/js/components/pages/helpers/BaseCharacterPhotosHelper.jsx` (new) — parallel to `BaseCharacterEditHelper.jsx`.
- `frontend/assets/js/components/pages/{Npc,Pc}Character{,Photos,Treasures}.jsx` — reduced to thin wrappers.
- `frontend/assets/js/components/pages/controllers/{Npc,Pc}Character{,Photos,Treasures}Controller.js` — reduced/merged into shared base usage.
- `frontend/assets/js/components/pages/helpers/{Npc,Pc}CharacterPhotosHelper.jsx` — reduced/merged.
- `frontend/assets/js/client/BaseClient.js` — add shared JSON/auth header helper methods.
- `frontend/assets/js/client/GameClient.js`, `TreasureClient.js`, `StaffUserClient.js`, `CharacterClient.js`, `GameSessionClient.js`, `AuthClient.js`, `GenericClient.js` — migrate to shared header helpers.
- `frontend/assets/js/client/CharacterClient.js` — collapse 13 pc/npc public method pairs into parameterized methods.
- `frontend/assets/js/components/pages/controllers/GameEditController.js`, `TreasureEditController.js`, `GameSessionEditController.js`, `StaffUserEditController.js`, `GameTreasureEditController.js` — refactor onto a new shared base controller.
- `frontend/assets/js/components/pages/controllers/BaseEditController.js` (new, name illustrative) — shared Edit-controller skeleton with hook points.
- `frontend/specs/**` (mirrors of all the above under `frontend/specs/js/...`) — updated only where call signatures/file layout changed, so the suite keeps passing; no new test-duplication cleanup.

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

Run these through the containerized toolchain, e.g. `docker-compose run frontend npm run lint` / `docker-compose run frontend npm run coverage` (or the project's documented equivalent) — never invoke `npm`/`yarn` directly on the host.

## Notes

- This issue is entirely within the `frontend` agent's scope (no backend/infra/proxy files touched), so this plan is not split by agent.
- The largest risk is Step 3 (collapsing `CharacterClient.js`'s public pc/npc pairs): it changes a public API surface with many call sites across controllers and specs. Do this step last among the client changes and run the full Jasmine suite immediately after to catch missed call sites.
- Step 1's detail-page extension point (NPC-only slain modal) and Step 4's Edit-controller hook (`TreasureEditController`'s superuser gate) are the two spots explicitly flagged in the issue as "asymmetric" — do not force artificial symmetry; use parameterization/hooks as designed above.
- No product/access-control or security review is needed: no new endpoints, no serializer/permission changes, purely internal frontend refactor of existing behavior.

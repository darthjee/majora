# Plan: Remove duplications in frontend/specs

Issue: [358-remove-duplications-in-frontend-specs.md](../issues/358-remove-duplications-in-frontend-specs.md)

## Overview

Add three shared spec-support helpers (fetch-mock/fake-`Response` builder, `buildEffect`-neutralizing stub, `renderLoading` stub) alongside the already-existing but unused `support/factories.js`, adopt `factories.js` and the new helpers across the ~50+ spec files that currently hand-roll this boilerplate, and — since #357 already landed its production-code merge of the Pc/Npc Photos/Treasures/detail pages onto shared bases (`shared/CharacterPhotos.jsx`, `shared/CharacterTreasures.jsx`, `shared/CharacterDetail.jsx`, `BaseCharacterPhotosController`, `BaseCharacterPhotosHelper`) — merge the corresponding pc/npc spec pairs into shared, parameterized specs. Entirely within the `frontend` agent's scope.

## Context

`frontend/specs` has four independent pockets of duplication, confirmed during exploration:

- **Unused factories**: `frontend/specs/support/factories.js` defines `buildGame`, `buildCharacter`, `buildLink`, but `grep` finds zero imports of it anywhere under `frontend/specs` — every spec that needs a game/character/link-shaped object hand-rolls the literal inline instead.
- **Client spec boilerplate**: 12 files under `frontend/specs/assets/js/client/**` (e.g. `CharacterClient/fetchCharacterSpec.js`, `GameClient/*Spec.js`, `AuthClient/*Spec.js`) each do `spyOn(globalThis, 'fetch')` + `fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }))` in a `beforeEach`, and repeat "sends the auth token when present" / "omits the Authorization header when there is no token" as near-identical `it` blocks. `grep -rln "json: () => Promise.resolve"` across `frontend/specs` returns 131 files.
- **Effect/loading stub boilerplate**: `grep -rl "buildEffect').and.returnValue"` returns 26 files and `grep -rl "renderLoading').and.returnValue"` returns 24 files, all repeating the same `spyOn(XController.prototype, 'buildEffect').and.returnValue(() => Noop.noop)` / `spyOn(XHelper, 'renderLoading').and.returnValue(...)` one-liners. `renderToStaticMarkup` from `react-dom/server` appears in 129 files with the same render-then-assert-on-HTML-string shape.
- **Pc/Npc spec pairs**: now that #357 merged the Pc/Npc Photos/Treasures/detail production components onto shared bases (`components/pages/shared/CharacterPhotos.jsx`, `CharacterTreasures.jsx`, `CharacterDetail.jsx`, `controllers/BaseCharacterPhotosController.js`, `helpers/BaseCharacterPhotosHelper.jsx`), the corresponding spec pairs are confirmed still separate and equal-length (byte-for-byte mirrors modulo `Pc`/`Npc`/`pc`/`npc`):
  - Page specs: `PcCharacterPhotosSpec.js`/`NpcCharacterPhotosSpec.js` (31/31 lines), `PcCharacterTreasuresSpec.js`/`NpcCharacterTreasuresSpec.js` (37/37), `PcCharacterSpec.js`/`NpcCharacterSpec.js` (33/33), `PcCharacterEditSpec.js`/`NpcCharacterEditSpec.js` (25/25).
  - Helper specs: `helpers/PcCharacterPhotosHelperSpec.js`/`NpcCharacterPhotosHelperSpec.js` (76/76), `helpers/PcCharacterEditHelperSpec.js`/`NpcCharacterEditHelperSpec.js` (106/106).
  - Controller spec folders (each already split into one file per method by #346/#368): `controllers/PcCharacterController/`↔`NpcCharacterController/` (`basicFetchSpec.js`, `canEditResolutionSpec.js`, `errorHandlingSpec.js`, `fullDetailFetchSpec.js`, `get*ParamsFromHashSpec.js`, `support.js`, `tokenHandlingSpec.js`), `PcCharacterEditController/`↔`NpcCharacterEditController/`, `PcCharacterPhotosController/`↔`NpcCharacterPhotosController/`, `PcCharacterTreasuresController/`↔`NpcCharacterTreasuresController/`.
  - `GamePcsControllerSpec.js` (39 lines, single file) vs `GameNpcsController/*Spec.js` (split, covers an NPC-only "create" flow) is confirmed asymmetric — leave unmerged, per the issue.

## Implementation Steps

### Step 1 — Adopt `support/factories.js`

1. Audit spec files that construct inline game/character/link-shaped literals (fields like `game_slug`, `profile_photo_path`, `is_pc`, `photos: []`, `links: []`) and migrate them to `buildGame`/`buildCharacter`/`buildLink` from `frontend/specs/support/factories.js`, passing only the field overrides each test actually needs.
2. Extend `factories.js` with any additional builder (e.g. a `buildPhoto`/`buildTreasure` if a comparably-repeated shape turns up during the audit) only if it is actually reused 3+ times — do not speculatively add builders nobody imports, echoing the very problem this step fixes.
3. Do not change factory defaults in ways that would silently alter existing assertions — when a test relies on a specific default value, pass it explicitly as an override rather than relying on the factory's current default.

### Step 2 — Shared fetch-mock helper for client specs

1. Add a `support/fetchMock.js` (name illustrative) exporting a helper such as `mockFetchJson(body, { ok = true } = {})` that returns the fake `Response`-shaped object (`{ ok, json: () => Promise.resolve(body) }`) used 131 times, plus a small helper/shared example (e.g. `itSendsAuthHeader(buildClientCall)` or a documented `beforeEach` snippet) that captures the repeated "sends the auth token when present" / "omits the Authorization header when there is no token" pair so each client spec states only what varies (path, method, args) rather than re-asserting the whole header-building contract inline.
2. Migrate the 12 client spec files under `frontend/specs/assets/js/client/**` (`CharacterClient/*Spec.js`, `GameClient/*Spec.js`, `TreasureClient/*Spec.js`, `AuthClient/*Spec.js`, `StaffUserClient/*Spec.js`, `GameSessionClient/*Spec.js`, `UploadClient/*Spec.js`) to use the new helper for their `fetchSpy` setup and auth-header test pair, keeping any client-specific extra assertions (e.g. `CharacterClient`'s `X-Skip-Cache` header check) as-is.
3. Keep `GenericClientSpec.js`/`HealthClientSpec.js`/`BaseClient/*Spec.js` on the new helper too where they already hand-roll the same `json: () => Promise.resolve(...)` shape.

### Step 3 — Shared `buildEffect`/`renderLoading` stub helpers

1. Add shared helpers (e.g. `support/controllerStubs.js`) exporting something like `stubBuildEffect(ControllerClass)` (wrapping `spyOn(ControllerClass.prototype, 'buildEffect').and.returnValue(() => Noop.noop)`) and `stubRenderLoading(HelperClass, markup)` (wrapping `spyOn(HelperClass, 'renderLoading').and.returnValue(...)`), plus — if it reduces real duplication rather than just wrapping one line — a small `renderMarkup(component)` helper around the repeated `renderToStaticMarkup(...)`-then-assert pattern used in 129 files.
2. Migrate the 26 files using the `buildEffect` stub and the 24 files using the `renderLoading` stub to the new helpers.
3. Only extract the `renderToStaticMarkup` pattern into a shared helper where the surrounding assertion shape is genuinely repeated (e.g. "renders and contains substring X"); do not force a one-size-fits-all wrapper onto specs whose post-render assertions differ structurally.

### Step 4 — Merge Pc/Npc spec pairs (depends on #357, already merged)

1. Merge the page spec pairs (`PcCharacterPhotosSpec.js`/`NpcCharacterPhotosSpec.js`, `PcCharacterTreasuresSpec.js`/`NpcCharacterTreasuresSpec.js`, `PcCharacterEditSpec.js`/`NpcCharacterEditSpec.js`) into shared, parameterized specs (e.g. one spec file per shared component, iterating `['pcs', 'npcs']` or using a small per-kind fixture table), following the same shared-base structure #357 introduced in production code (`shared/CharacterPhotos.jsx`, `CharacterTreasures.jsx`, `CharacterEdit.jsx`).
2. Merge the corresponding helper spec pairs (`helpers/PcCharacterPhotosHelperSpec.js`/`NpcCharacterPhotosHelperSpec.js`, `helpers/PcCharacterEditHelperSpec.js`/`NpcCharacterEditHelperSpec.js`) similarly, targeting the shared `BaseCharacterPhotosHelper`/`BaseCharacterEditHelper` behavior plus any per-kind override left in the thin `Pc*/Npc*` wrapper helpers.
3. Merge the controller spec folder pairs (`PcCharacterController/`↔`NpcCharacterController/`, `PcCharacterEditController/`↔`NpcCharacterEditController/`, `PcCharacterPhotosController/`↔`NpcCharacterPhotosController/`, `PcCharacterTreasuresController/`↔`NpcCharacterTreasuresController/`) file-by-file (e.g. merge `basicFetchSpec.js` pairs into one, `errorHandlingSpec.js` pairs into one, etc.), keeping the one-file-per-method granularity #346/#368 already established, parameterized by `characterKind`.
4. Merge the detail-page spec pair (`PcCharacterSpec.js`/`NpcCharacterSpec.js`), preserving the NPC-only slain-modal assertions as an additional `it` block scoped to the `npcs` case only — do not force symmetry where #357's production code itself didn't (the NPC detail page carries `SlainConfirmModal`/`SlainConfirmController` that PC does not).
5. Explicitly leave `GamePcsControllerSpec.js`/`GameNpcsController/*Spec.js` unmerged — confirmed asymmetric (NPC-only "create" flow), matching the issue's guidance.
6. Use the Step 1–3 helpers (factories, fetch-mock, effect/loading stubs) while merging these pairs so the merged specs are also free of the other three duplication patterns, rather than merging first and cleaning up twice.

### Step 5 — Verify

Run the full frontend dev cycle after each step (lint + full Jasmine suite), confirming no spec references a stale `Pc*`/`Npc*` file that Step 4 removed, and that coverage does not regress.

## Files to Change

- `frontend/specs/support/factories.js` — extend only if a genuinely repeated shape (3+ uses) is found beyond `buildGame`/`buildCharacter`/`buildLink`.
- `frontend/specs/support/fetchMock.js` (new, name illustrative) — shared fake-`Response`/fetch-mock builder and auth-header test helper.
- `frontend/specs/support/controllerStubs.js` (new, name illustrative) — shared `buildEffect`/`renderLoading` stub helpers.
- `frontend/specs/assets/js/client/**/*Spec.js` (12 files: `CharacterClient/`, `GameClient/`, `TreasureClient/`, `AuthClient/`, `StaffUserClient/`, `GameSessionClient/`, `UploadClient/`, plus `GenericClientSpec.js`, `HealthClientSpec.js`, `BaseClient/*Spec.js`) — migrate to the fetch-mock helper and shared auth-header test.
- ~50+ spec files across `frontend/specs/assets/js/components/**` — migrate inline game/character/link literals to `factories.js`, and `buildEffect`/`renderLoading` boilerplate to `controllerStubs.js` (26 + 24 files respectively).
- `frontend/specs/assets/js/components/pages/{Pc,Npc}Character{,Photos,Treasures,Edit}Spec.js` — merged into shared parameterized specs.
- `frontend/specs/assets/js/components/pages/helpers/{Pc,Npc}Character{Photos,Edit}HelperSpec.js` — merged into shared parameterized specs.
- `frontend/specs/assets/js/components/pages/controllers/{Pc,Npc}Character{,Edit,Photos,Treasures}Controller/*Spec.js` — merged pair-by-pair, keeping one-file-per-method granularity.
- `frontend/specs/assets/js/components/pages/controllers/GamePcsControllerSpec.js` and `GameNpcsController/*Spec.js` — left unmerged (confirmed asymmetric).

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

Run these through the containerized toolchain, e.g. `docker-compose run frontend npm run lint` / `docker-compose run frontend npm run coverage` (or the project's documented equivalent) — never invoke `npm`/`yarn` directly on the host.

## Notes

- This issue is entirely within the `frontend` agent's scope (only `frontend/specs/**` and, incidentally, `frontend/specs/support/**`), so this plan is not split by agent.
- Step 4 (pc/npc spec merge) was blocked on #357's production-code merge; #357 has since merged (commit `b7c5936`, PR #371), so all four steps can now proceed together or Step 4 can follow Steps 1–3 — either order is fine since Steps 1–3 do not touch the same pc/npc spec pairs' file identity, only their internal boilerplate.
- Do the pc/npc merges (Step 4) incrementally, one component family at a time (Photos, then Treasures, then Edit, then detail), running the full suite after each, since a botched merge silently losing an assertion is the main risk — these are the highest-value, highest-line-count files in the issue (~1,850+ duplicated lines).
- No product/access-control or security review is needed: no production code, endpoints, or serializer/permission changes — this is a test-only refactor.

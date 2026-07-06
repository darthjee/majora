# Plan: Split frontend test

Issue: [346-split-frontend-test.md](../../issues/346-split-frontend-test.md)

## Overview

Break up frontend Jasmine spec files that currently mix the tests of more than one method,
or more than one distinct scenario/concern of a single method, into a folder named after the
class/module under test, with one spec file per concern inside it. This is a single-agent
(frontend-only) change — no backend, infra, proxy, or translation work is involved.

## Context

Several spec files under `frontend/specs/` test a class or module with more than one method
(or more than one distinct scenario/concern) entirely within one file, and many have grown
past 200-300 lines (e.g. `PcCharacterControllerSpec.js`, `CharacterHelperSpec.js`,
`HeaderControllerSpec.js`, `TreasureClientSpec.js`, `AuthClientSpec.js`). This makes it harder
to find the tests relevant to a single concern and produces large diffs for small changes.

The Jasmine runner already globs recursively (`specs/**/*[sS]pec.js` in
`frontend/package.json`'s `test` script), so nested folders of spec files work with no runner
config changes.

## Convention to apply

- **Method-oriented classes** (already have clear `describe('#methodName', ...)` boundaries,
  e.g. clients and some controllers): replace `<Name>Spec.js` with a folder `<Name>/` containing
  one file per method, named `<methodName>Spec.js` (camelCase, no leading `#`).
- **Scenario-oriented modules** (a single method/effect tested through many flat `it(...)`
  scenarios with no per-method `describe` boundaries, e.g. `PcCharacterControllerSpec.js`):
  replace `<Name>Spec.js` with a folder `<Name>/` containing one file per logical
  concern/context (e.g. `tokenHandlingSpec.js`, `fullDetailFetchSpec.js`), grouping scenarios
  by what they exercise rather than by method name.
- **Shared setup/helpers** used by more than one split file in a folder (e.g. the
  `buildEffectController` factory redefined at the top of controller specs) must be extracted
  into a single shared module inside the folder (e.g. `<Name>/support.js`) and imported by each
  split file — never duplicated per file.
- Top-level `describe('<Name>', ...)` wrapping can be dropped or kept per split file at the
  implementer's judgment, as long as failure output remains clearly attributable to the class
  and concern (e.g. `describe('<Name> - <concern>', ...)`).

## Implementation Steps

### Step 1 — Method-oriented splits (mechanical, low risk)

For every file below, which already contains 2+ `describe('#methodName', ...)` blocks for
distinct methods, create a folder of the same base name and move each method's `describe`
block (plus any method-specific `beforeEach`/fixtures) into its own file inside it. Shared
top-of-file setup (imports, spies, factories) common to all methods goes into the folder's
`support.js` (or is duplicated only if trivial, e.g. a single import line).

See "Files to Change" below for the full file list — includes API clients (`client/*ClientSpec.js`)
and controllers/helpers with clear per-method boundaries.

### Step 2 — Fold in the already partially-split `CharacterClient` family

`client/CharacterClientSpec.js` (11 methods) already has some sibling files extracted ad hoc,
without a folder: `CharacterClientNpcCreateSpec.js`, `CharacterClientNpcDetailSpec.js`,
`CharacterClientNpcsAllSpec.js`, `CharacterClientPhotoRolesSpec.js`, `CharacterClientSlainSpec.js`.
Consolidate all of these plus the remaining methods in `CharacterClientSpec.js` into a single
`client/CharacterClient/` folder, one file per method (e.g. `fetchPcSpec.js`, `updateNpcSpec.js`,
`setPcPhotoRolesSpec.js`, etc.), so the whole class follows the same convention instead of mixing
the old ad-hoc flat-sibling style with the new folder style.

### Step 3 — Scenario-oriented splits for large flat-scenario spec files

For every file below (all >= ~200 lines, tested through many flat `it(...)` scenarios rather
than per-method `describe` blocks), group the existing scenarios by logical concern and split
each group into its own file inside a same-named folder, extracting shared factories (e.g.
`buildEffectController`) into the folder's `support.js`.

See "Files to Change" below for the full file list.

### Step 4 — Verify

Run the full Jasmine suite (see CI Checks below) after each batch of moves to confirm no test
was dropped or silently broken by the file moves (same assertions, same `it` descriptions,
same pass/fail behavior — this is a pure reorganization, not a behavior change).

## Files to Change

### Step 1 — method-oriented (folder + one file per method)

- `frontend/specs/assets/js/client/AuthClientSpec.js` -> `client/AuthClient/`
- `frontend/specs/assets/js/client/TreasureClientSpec.js` -> `client/TreasureClient/`
- `frontend/specs/assets/js/client/GameClientSpec.js` -> `client/GameClient/`
- `frontend/specs/assets/js/client/StaffUserClientSpec.js` -> `client/StaffUserClient/`
- `frontend/specs/assets/js/client/GameSessionClientSpec.js` -> `client/GameSessionClient/`
- `frontend/specs/assets/js/client/UploadClientSpec.js` -> `client/UploadClient/`
- `frontend/specs/assets/js/components/elements/controllers/HeaderControllerSpec.js` -> `HeaderController/`
- `frontend/specs/assets/js/components/elements/controllers/TreasureExchangeModalControllerSpec.js` -> `TreasureExchangeModalController/`
- `frontend/specs/assets/js/components/elements/controllers/LoginModalControllerSpec.js` -> `LoginModalController/`
- `frontend/specs/assets/js/components/elements/controllers/PhotoUploadModalControllerSpec.js` -> `PhotoUploadModalController/`
- `frontend/specs/assets/js/components/elements/controllers/LanguageSelectorControllerSpec.js` -> `LanguageSelectorController/`
- `frontend/specs/assets/js/components/elements/controllers/HeaderControllerHealthCheckSpec.js` -> fold into `HeaderController/` folder above (same class, different concern) rather than its own folder
- `frontend/specs/assets/js/components/pages/controllers/CharacterControllerSpec.js` -> `CharacterController/`
- `frontend/specs/assets/js/components/pages/controllers/StaffUsersControllerSpec.js` -> `StaffUsersController/`
- `frontend/specs/assets/js/components/pages/controllers/BaseCharacterEditControllerSpec.js` -> `BaseCharacterEditController/`
- `frontend/specs/assets/js/components/pages/helpers/BaseCharacterEditHelperSpec.js` -> `BaseCharacterEditHelper/`
- `frontend/specs/assets/js/components/pages/controllers/TreasureNewControllerSpec.js` -> `TreasureNewController/`
- `frontend/specs/assets/js/components/pages/controllers/TreasureEditControllerSpec.js` -> `TreasureEditController/`
- `frontend/specs/assets/js/components/pages/controllers/StaffUserEditControllerSpec.js` -> `StaffUserEditController/`
- `frontend/specs/assets/js/components/pages/controllers/PcCharacterEditControllerSpec.js` -> `PcCharacterEditController/`
- `frontend/specs/assets/js/components/pages/controllers/NpcCharacterEditControllerSpec.js` -> `NpcCharacterEditController/`
- `frontend/specs/assets/js/components/pages/controllers/MyAccountControllerSpec.js` -> `MyAccountController/`
- `frontend/specs/assets/js/components/pages/controllers/GameTreasureNewControllerSpec.js` -> `GameTreasureNewController/`
- `frontend/specs/assets/js/components/pages/controllers/GameTreasureEditControllerSpec.js` -> `GameTreasureEditController/`
- `frontend/specs/assets/js/components/pages/controllers/GameSessionNewControllerSpec.js` -> `GameSessionNewController/`
- `frontend/specs/assets/js/components/pages/controllers/GameSessionEditControllerSpec.js` -> `GameSessionEditController/`
- `frontend/specs/assets/js/components/pages/controllers/GameNpcNewControllerSpec.js` -> `GameNpcNewController/`
- `frontend/specs/assets/js/components/pages/controllers/GameNewControllerSpec.js` -> `GameNewController/`
- `frontend/specs/assets/js/components/pages/controllers/GameEditControllerSpec.js` -> `GameEditController/`

### Step 2 — `CharacterClient` consolidation

- `frontend/specs/assets/js/client/CharacterClientSpec.js`
- `frontend/specs/assets/js/client/CharacterClientNpcCreateSpec.js`
- `frontend/specs/assets/js/client/CharacterClientNpcDetailSpec.js`
- `frontend/specs/assets/js/client/CharacterClientNpcsAllSpec.js`
- `frontend/specs/assets/js/client/CharacterClientPhotoRolesSpec.js`
- `frontend/specs/assets/js/client/CharacterClientSlainSpec.js`
  -> all merged into `frontend/specs/assets/js/client/CharacterClient/`, one file per method

### Step 3 — scenario-oriented (folder + one file per concern group)

- `frontend/specs/assets/js/components/pages/helpers/CharacterHelperSpec.js` -> `CharacterHelper/`
- `frontend/specs/assets/js/components/elements/helpers/HeaderHelperSpec.js` -> `HeaderHelper/`
- `frontend/specs/assets/js/components/pages/helpers/GameHelperSpec.js` -> `GameHelper/`
- `frontend/specs/assets/js/client/BaseClientSpec.js` -> `client/BaseClient/`
- `frontend/specs/assets/js/components/elements/helpers/TreasureExchangeModalHelperSpec.js` -> `TreasureExchangeModalHelper/`
- `frontend/specs/assets/js/components/elements/PhotoUploadOverlaySpec.js` -> `PhotoUploadOverlay/`
- `frontend/specs/assets/js/components/pages/controllers/GameControllerSpec.js` -> `GameController/`
- `frontend/specs/assets/js/components/pages/controllers/PcCharacterControllerSpec.js` -> `PcCharacterController/`
- `frontend/specs/assets/js/components/pages/controllers/NpcCharacterControllerSpec.js` -> `NpcCharacterController/`
- `frontend/specs/assets/js/components/pages/controllers/PcCharacterPhotosControllerSpec.js` -> `PcCharacterPhotosController/`
- `frontend/specs/assets/js/components/pages/controllers/NpcCharacterPhotosControllerSpec.js` -> `NpcCharacterPhotosController/`
- `frontend/specs/assets/js/components/elements/helpers/LoginModalHelperSpec.js` -> `LoginModalHelper/`
- `frontend/specs/assets/js/components/pages/controllers/GameNpcsControllerSpec.js` -> `GameNpcsController/`
- `frontend/specs/assets/js/components/pages/controllers/GamePhotosControllerSpec.js` -> `GamePhotosController/`
- `frontend/specs/assets/js/components/pages/controllers/GameSessionsControllerSpec.js` -> `GameSessionsController/`
- `frontend/specs/assets/js/components/pages/controllers/GameTreasuresControllerSpec.js` -> `GameTreasuresController/`
- `frontend/specs/assets/js/components/pages/controllers/PcCharacterTreasuresControllerSpec.js` -> `PcCharacterTreasuresController/`
- `frontend/specs/assets/js/components/pages/controllers/NpcCharacterTreasuresControllerSpec.js` -> `NpcCharacterTreasuresController/`

Note: `PcCharacterController`/`NpcCharacterController` and `PcCharacterPhotosController`/
`NpcCharacterPhotosController` and `PcCharacterTreasuresController`/`NpcCharacterTreasuresController`
are structurally near-identical Pc/Npc sibling pairs — use the same concern grouping and file
names in both folders of each pair for consistency.

## CI Checks

- `frontend`: `docker-compose run majora_fe yarn test` (CI job: `jasmine`)
- `frontend`: `docker-compose run majora_fe yarn lint` (CI job: `frontend-checks`, if lint is part of that job — verify against `.circleci/config.yml`)

## Notes

- This is a pure test-file reorganization: no production code, no `describe`/`it` text, and no
  assertions should change — only file boundaries and (necessarily) the local `import` paths
  inside each moved spec file (they gain one extra `../` level per folder nesting).
- Scope was bounded using the issue's own size cue ("grown past 200-300 lines") for the
  scenario-oriented bucket (Step 3), rather than splitting every spec file with more than a
  handful of `it` blocks — many small helper specs (under ~200 lines) test a single rendering
  method through a handful of straightforward branches and do not meaningfully suffer from the
  problem this issue describes. If reviewers want the convention extended further down, file a
  follow-up issue rather than expanding this one indefinitely.
- Given the number of files touched, the frontend agent may find it practical to commit in a
  few logical batches (e.g. clients, then controllers, then helpers) rather than one single
  commit, as long as the suite passes at each step and everything lands in the same PR.
- Double-check `jasmine`'s coverage tool (`nyc`) does not need path updates — coverage is
  computed from `assets/js` source files, not from `specs/`, so moving spec files should not
  affect coverage collection.

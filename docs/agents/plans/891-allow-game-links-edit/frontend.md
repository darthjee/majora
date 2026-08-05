# Frontend Plan: Allow game links edit

Main plan: [plan.md](plan.md)

## Shared contracts

This agent **consumes** the `PATCH /games/:game_slug.json` contract and the `can_edit_regular`
permission flag the backend agent produces (see [plan.md](plan.md)'s "Shared contracts" section).
It also relies on `GameAccessSerializer`/`access.json` (`is_player`/`is_staff`), which already
exists on the backend and needs no change — only wiring up `AccessStore.ensureGameAccess` on the
frontend side, which today `GameEditController` doesn't call.

## Implementation Steps

### Step 1 — Relocate `LinksEditModal`/`CharacterLinksField` to `components/common/`

Per `docs/agents/frontend/pages-elements.md`'s documented convention (an element used by more
than one resource belongs under `components/common/`, not a resource's `pages/elements/`):

- Move `LinksEditModal.jsx` + `controllers/LinksEditModalController.js` +
  `helpers/LinksEditModalHelper.jsx` from `character/pages/elements/` to `components/common/`
  (pick a themed subfolder, e.g. `common/modals/`, alongside `PhotoUploadModal`/`MoneyEditModal`).
- Move `CharacterLinksField.jsx` + `helpers/CharacterLinksFieldHelper.jsx`, renaming away from
  "Character" (e.g. `LinksField.jsx` + `LinksFieldHelper.jsx`), to `components/common/`.
- Update every importer (`CharacterEdit.jsx`, `GameNpcNew.jsx`, `CharacterLinksSlot.jsx`) to the
  new paths. Pure move/rename — no behavior change for existing character flows.
- Move the corresponding specs (`LinksEditModalSpec.js`, `LinksEditModalControllerSpec.js`,
  `LinksEditModalHelperSpec.js`, and the `CharacterLinksField`/`CharacterLinksFieldHelper` specs)
  to mirror the new paths under `frontend/specs/`.

### Step 2 — `GameLinksSlot.jsx` (new)

Add `resources/game/pages/elements/show/GameLinksSlot.jsx`, mirroring
`resources/character/pages/elements/show/CharacterLinksSlot.jsx`:

- `GameLinksShow({ links })` — show-mode: `<LinkList links={links} />`.
- `buildGameLinksField(buttonLabelKey)` — edit-mode: returns a component rendering the relocated
  `LinksField` (links preview + "Edit links" button) wired to `handlers.onOpenLinksModal`, same
  shape as `buildCharacterLinksField`.

### Step 3 — `gameShowType.js`: move the links slot, left column

Edit `common/show_page/show_types/configs/gameShowType.js`:

- Remove the `right`-column `{ Show: LinkList }` entry (and its now-unused `LinkList` import, if
  nothing else in this file needs it).
- Add `{ Show: GameLinksShow, Edit: gameLinksField }` to the `left` array, positioned **before**
  `GameNextSessionBlock` (after `GameCoverPhoto`).
- `gameLinksField = buildGameLinksField('game_edit_page.edit_links_button')` — new i18n key (see
  Step 6).

### Step 4 — `GameEdit.jsx`: links state + modal wiring

- Add `links`/`showLinksModal` state (`useState`), seeded from the loaded game's `links` in the
  existing load `useEffect` (alongside `name`/`description`).
- Add `onOpenLinksModal: () => setShowLinksModal(true)` to the handlers object passed to
  `GameEditHelper.render`, and pass `links` through in the formState object.
- Render `<LinksEditModal show={showLinksModal} links={links} onClose={...} onConfirm={(newLinks)
  => { setLinks(newLinks); setShowLinksModal(false); }} />` alongside the existing
  `<PhotoUploadModal>`.
- Include `links` in the object passed to `controller.submitForm`, alongside `fields`.

### Step 5 — `GameEditController`: regular/restricted reachability + submit payload

- `submitForm`: include `links: formValues.links` in the PATCH body sent via `RequestStore.mutate`
  (alongside the existing `name`/`description`).
- `loadResource`: also merge `AccessStore.ensureGameAccess(gameSlug)` (for `is_player`/
  `is_staff`) alongside the existing `AccessStore.ensureGamePermissions(gameSlug)` call, so both
  land on the `game` object passed to the page.
- In `GameEdit.jsx`, replace the current `!game.can_edit` redirect-away check with
  `canReachEditPage`-style logic: `game.can_edit || game.is_player || game.is_staff`. Thread an
  `isFullEditor = game.can_edit` flag down through `GameEditHelper.render`'s formState.

### Step 6 — Gate the `name` field for regular (non-full) editors

- In `gameShowType.js`, wrap the existing `GameNameField` edit slot so it renders read-only/
  disabled when `!isFullEditor` — mirroring `pcShowType.js`'s `buildCharacterNameField({...},
  true)` pattern (check that helper's exact signature before reusing/adapting it).
- Add the new i18n key `game_edit_page.edit_links_button` to `frontend/assets/i18n/en.yaml`
  (only language file today — see `docs/agents/frontend/i18n.md`), following the existing
  `pc_edit_page.edit_links_button` string as a model.

## Files to Change

- `components/resources/character/pages/elements/LinksEditModal.jsx` (+ controller/helper) →
  moved to `components/common/modals/`.
- `components/resources/character/pages/elements/CharacterLinksField.jsx` (+ helper) → moved to
  `components/common/` as `LinksField.jsx` (+ helper).
- `components/resources/character/pages/shared/CharacterEdit.jsx`,
  `components/resources/character/pages/GameNpcNew.jsx`,
  `components/resources/character/pages/elements/show/CharacterLinksSlot.jsx` — updated imports.
- `components/resources/game/pages/elements/show/GameLinksSlot.jsx` — new.
- `components/common/show_page/show_types/configs/gameShowType.js` — slot move + `name` field
  gating.
- `components/resources/game/pages/GameEdit.jsx` — links state, modal, permission gating.
- `components/resources/game/pages/controllers/GameEditController.js` — submit payload,
  access merge.
- `assets/i18n/en.yaml` — new `game_edit_page.edit_links_button` key.
- Corresponding specs: relocated `LinksEditModal*`/`LinksField*` specs, new `GameLinksSlotSpec.js`,
  updated `gameShowTypeSpec.js`, `GameEditSpec.js`, `GameEditHelperSpec.js`,
  `GameEditControllerSpec.js`.

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine` — Jasmine specs).
- `frontend`: `npm run lint` (CI job: `frontend-checks` — ESLint).
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks` — verifies the new translation key;
  trivial today since `en.yaml` is the only language file, but still runs).

## Notes

- Confirm `pcShowType.js`'s exact `buildCharacterNameField(config, isFullEditorGated)` signature
  before adapting it for `GameNameField` — the plan assumes a boolean toggles full-editor gating,
  but the real parameter shape should be checked against the current source.
- The relocation in Step 1 touches already-shipped character code (import paths, spec locations) —
  this was an explicit, deliberate decision during issue refinement (follows the project's own
  documented convention once a second resource needs the component), not scope creep.

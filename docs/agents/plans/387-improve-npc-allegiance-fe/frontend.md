# Frontend Plan: Improve NPC allegiance FE

Main plan: [plan.md](plan.md)

## Shared contracts

- Rely on `backend` adding `allegiance`/`public_allegiance` (optional,
  `ally`/`enemy`/`neutral`, default `neutral`) to `CharacterCreateSerializer`
  — safe to send both fields on `POST /games/<slug>/npcs.json` once that
  lands (sequence backend first, or land both in the same PR/commit set).
  `CharacterUpdateSerializer` already accepts both, so the edit form has no
  backend dependency.
- Rely on `translator` adding the keys listed in `plan.md`'s "Shared
  contracts" section under `game_npc_new_page`, `npc_edit_page`, and
  `game_npcs_page`. Use those exact key names in `Translator.t()` calls; if
  you need different names, update `plan.md`/`translator.md` accordingly.
- No backend change is needed for the filter — `GET /games/<slug>/npcs.json`
  and `GET /games/<slug>/npcs/all.json` already accept `?allegiance=...`, and
  `GameNpcsController.js` already forwards every filter param unchanged.

## Implementation Steps

### Step 1 — Add Allegiance/Public Allegiance selects to the NPC creation form

Files: `frontend/assets/js/components/pages/GameNpcNew.jsx`,
`frontend/assets/js/components/pages/helpers/GameNpcNewHelper.jsx`,
`frontend/assets/js/components/pages/controllers/GameNpcNewController.js`.

- `GameNpcNew.jsx`: add `allegiance`/`publicAllegiance` state (`useState`,
  both defaulting to `'neutral'`), pass them into `formState` and add
  `onAllegianceChange`/`onPublicAllegianceChange` handlers (same pattern as
  `onHiddenChange`), and include both in the object passed to
  `controller.submitForm`.
- `GameNpcNewHelper.jsx`: add two `<select className="form-select">`
  elements (no existing reusable `SelectField` component in this codebase —
  plain `<select>` matching `NpcFiltersHelper.jsx`'s status dropdown markup
  is the established pattern), each with three `<option>`s
  (`ally`/`enemy`/`neutral`) labelled via
  `Translator.t('game_npc_new_page.allegiance_ally')` etc., placed after the
  `hidden` checkbox and before the money field (or wherever reads best).
  Use ids `game-npc-new-allegiance` / `game-npc-new-public-allegiance`.
- `GameNpcNewController.js`: in `submitForm`, add
  `allegiance: formValues.allegiance` and
  `public_allegiance: formValues.publicAllegiance` to the
  `characterClient.createNpc(...)` payload object.

### Step 2 — Add the same two selects to the NPC edit form only

Files: `frontend/assets/js/components/pages/helpers/BaseCharacterEditHelper.jsx`,
`frontend/assets/js/components/pages/helpers/NpcCharacterEditHelper.jsx`,
`frontend/assets/js/components/pages/shared/CharacterEdit.jsx`,
`frontend/assets/js/components/pages/controllers/BaseCharacterEditController.js`.

`BaseCharacterEditHelper`/`CharacterEdit.jsx`/`BaseCharacterEditController`
are shared between the NPC and PC edit pages (constructed with an
`idPrefix`/`i18nNamespace` pair, or a `characterKind` of `'pcs'`/`'npcs'`).
Gate the allegiance fields so they only render/submit for NPCs:

- `BaseCharacterEditHelper.jsx`: `render()` already has `idPrefix` available
  (`'npc'` vs `'pc'`, set at construction time by
  `NpcCharacterEditHelper`/`PcCharacterEditHelper`). Add
  `if (idPrefix === 'npc') { ... }` around the two new `<select>` elements
  (same markup/labels as Step 1, using `Translator.t('npc_edit_page....')`),
  rendered only for the NPC variant. Do not add them unconditionally, since
  this same method renders the PC edit page too.
- `CharacterEdit.jsx`: add `allegiance`/`publicAllegiance` state, seed them
  via a new `setAllegiance`/`setPublicAllegiance` pair passed into
  `controller.applyLoadedCharacter(...)`'s `setters` object, include them in
  the object passed to `EditHelper.render(...)`'s first argument, and add
  `onAllegianceChange`/`onPublicAllegianceChange` handlers passed to
  `EditHelper.render(...)`'s second argument — always pass them through
  (cheap no-ops for PC, since `BaseCharacterEditHelper` only reads them when
  `idPrefix === 'npc'`); no need to gate on `characterKind` here since the
  helper itself gates rendering.
- `BaseCharacterEditController.js`:
  - `#fieldsFromCharacter`: add `allegiance: character.allegiance ?? 'neutral'`
    and `public_allegiance: character.public_allegiance ?? 'neutral'` to the
    returned object (harmless for PC — `character.allegiance` is simply
    `undefined` there today and the field is never rendered/submitted for
    PCs since Step 2's helper gating prevents it from reaching the payload
    in a meaningful way, but keeping the base controller symmetric avoids
    a second gated code path here).
  - `applyLoadedCharacter`: call the new `setters.setAllegiance`/
    `setters.setPublicAllegiance` with those fields.
  - `submitForm`: add `allegiance: formValues.allegiance` and
    `public_allegiance: formValues.publicAllegiance` to the fields object
    passed to `handleSubmit` — again harmless for PC since
    `CharacterUpdateSerializer` simply ignores fields not relevant... **verify
    this assumption before relying on it**: `CharacterUpdateSerializer` is
    shared by both PC and NPC updates and already declares both fields, so
    sending them for a PC update would actually persist an `allegiance` value
    on a PC row. To avoid ever writing allegiance onto a PC, gate the
    inclusion of these two keys in `submitForm` on
    `this.routeSegment === 'npcs'` (already available on `this` — see
    constructor's `routeSegment` param) instead of sending them
    unconditionally.

### Step 3 — Add the Allegiance filter to the NPC index

Files: `frontend/assets/js/components/elements/NpcFilters.jsx`,
`frontend/assets/js/components/elements/helpers/NpcFiltersHelper.jsx`,
`frontend/assets/js/components/elements/controllers/NpcFiltersController.js`.

- `NpcFiltersController.js`: add an `allegiance` draft field — constructor
  takes a new `setAllegiance` setter alongside `setStatus`/`setName`; add
  `handleAllegianceChange(value)` (same shape as `handleStatusChange`);
  extend `buildQuery(status, name, allegiance)` to add `query.allegiance =
  allegiance` when non-blank (no mapping needed, unlike `status`→`slain` —
  the dropdown value **is** the query value, `''`/`'ally'`/`'enemy'`/
  `'neutral'`); extend `clear()` to also call `this.setAllegiance('')`.
- `NpcFilters.jsx`: add `const [allegiance, setAllegiance] =
  useState(initialFilters.get('allegiance') ?? '')`, pass `setAllegiance`
  into the `NpcFiltersController` constructor, pass `allegiance` into the
  state object and an `onAllegianceChange` handler into the helper call, and
  include `allegiance` in `controller.buildQuery(status, name, allegiance)`.
- `NpcFiltersHelper.jsx`: add a new `<select>` block (copy the existing
  Status `<div className="col-auto">` block), id
  `npc-filter-allegiance`/`data-testid="npc-filter-allegiance"`, options
  blank/`ally`/`enemy`/`neutral` labelled via
  `Translator.t('game_npcs_page.filter_allegiance_ally')` etc., placed next
  to the Status filter as the issue specifies.

### Step 4 — Update Jasmine specs

Extend the existing spec files for every file touched above (do not create
parallel spec files if one already covers the component/controller/helper):
- `frontend/specs/assets/js/components/pages/GameNpcNewSpec.js` /
  `frontend/specs/assets/js/components/pages/helpers/GameNpcNewHelperSpec.js` /
  `frontend/specs/assets/js/components/pages/controllers/GameNpcNewController/*`
- NPC/PC edit page, helper, and controller specs (find via
  `frontend/specs/assets/js/components/pages/**/*CharacterEdit*`) — assert
  the allegiance selects render for NPC and do **not** render for PC, and
  that the PC submit payload never includes `allegiance`/
  `public_allegiance`.
- `frontend/specs/assets/js/components/elements/NpcFiltersSpec.js` /
  `NpcFiltersHelperSpec.js` / `controllers/NpcFiltersControllerSpec.js`.

Run `docker-compose run --rm frontend npm run coverage` locally to confirm
coverage thresholds still pass after the new branches are added (the
`idPrefix === 'npc'` / `routeSegment === 'npcs'` gates need both-sides
coverage).

## Files to Change

- `frontend/assets/js/components/pages/GameNpcNew.jsx`
- `frontend/assets/js/components/pages/helpers/GameNpcNewHelper.jsx`
- `frontend/assets/js/components/pages/controllers/GameNpcNewController.js`
- `frontend/assets/js/components/pages/helpers/BaseCharacterEditHelper.jsx`
- `frontend/assets/js/components/pages/shared/CharacterEdit.jsx`
- `frontend/assets/js/components/pages/controllers/BaseCharacterEditController.js`
- `frontend/assets/js/components/elements/NpcFilters.jsx`
- `frontend/assets/js/components/elements/helpers/NpcFiltersHelper.jsx`
- `frontend/assets/js/components/elements/controllers/NpcFiltersController.js`
- Corresponding spec files under `frontend/specs/...` for every file above

## CI Checks

- `frontend/`: `docker-compose run --rm frontend npm run coverage` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm frontend npm run lint` (CI job: `frontend-checks`)

## Notes

- The trickiest part is the PC/NPC edit-form sharing: confirm during
  implementation that `CharacterUpdateSerializer` is indeed shared for both
  `pcs`/`npcs` PATCH routes (it is — see `source/games/serializers/character_update.py`,
  used generically by `routeSegment`), which is why the frontend must gate
  the payload itself rather than relying on the backend to silently ignore
  the fields for PCs.
- `NpcFiltersController#buildQuery`'s `allegiance` handling is simpler than
  `status`'s (no value remapping needed) — do not over-engineer a mapping
  layer for it.

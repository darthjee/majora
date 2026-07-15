# Frontend Plan: Add hidden Npc feature

Main plan: [plan.md](plan.md)

## Shared contracts

- Reads `hidden` (boolean) from the DM/admin-only `full.json`/`all.json` responses once `backend` adds it (see `backend.md`) — do not rely on it being present on `npcs.json`/`:id.json` responses (public, correctly omit it).
- Submits `hidden` on `POST npcs.json` (already works today via the New form) and `PATCH npcs/:id/full.json` (already accepted by `CharacterUpdateSerializer` — the Edit form just needs to start sending it).
- Filters `GET npcs/all.json?hidden=true|false` once `backend` adds the query param (see `backend.md`).
- Calls `Translator.t(...)` for every new/changed string — see `translator.md` for the exact keys.
- NPC-only, DM/admin-only scope everywhere (see `plan.md`'s "Shared contracts").

## Implementation Steps

### Step 1 — Restyle/reposition the New NPC form's hidden control

In `frontend/assets/js/components/resources/character/pages/helpers/GameNpcNewHelper.jsx`:
- Move the existing hidden `form-check` block (lines 90-101) into the `col-md-4` column, directly below `<CharacterAvatarField .../>` (before `<CharacterLinksField .../>`, around line 49-50).
- Convert it to a bootstrap switch: add `form-switch` to the wrapping div's class and `role="switch"` on the `<input>` (keep `id="game-npc-new-hidden"`, `checked`/`onChange` unchanged).
- No DM/admin gating needed here — the New NPC page is already DM/admin-only end to end.

### Step 2 — Add the hidden switch to the Edit NPC form

In `frontend/assets/js/components/resources/character/pages/helpers/BaseCharacterEditHelper.jsx`:
- Add a new private method `#renderHiddenField(state, handlers)`, mirroring `#renderSlainField` (lines 201-222) but gated on both NPC-only and DM/admin-only:

```jsx
#renderHiddenField(state, handlers) {
  if (this.idPrefix !== 'npc' || !state.isFullEditor) {
    return null;
  }

  const { idPrefix, i18nNamespace } = this;

  return (
    <div className="form-check form-switch mb-3">
      <input
        id={`${idPrefix}-edit-hidden`}
        type="checkbox"
        role="switch"
        className="form-check-input"
        checked={state.hidden}
        onChange={handlers.onHiddenChange}
      />
      <label htmlFor={`${idPrefix}-edit-hidden`} className="form-check-label">
        {Translator.t(`${i18nNamespace}.hidden_label`)}
      </label>
    </div>
  );
}
```

- Call it directly after `<CharacterAvatarField .../>` in `render()` (line 65-69), before `{this.#renderNameField(state, handlers)}` (line 70), so it renders immediately below the portrait as the issue requests.
- Thread `hidden`/`onHiddenChange` through the state/handlers JSDoc (state: add `hidden: boolean`; handlers: add `onHiddenChange: Function`).
- Wire the actual state + handler + payload plumbing in `NpcCharacterEditController.js`/the controller `BaseCharacterEditHelper` is composed with (search `grep -rl NpcCharacterEditHelper` to find the page/controller pair): add a `hidden` field to component state, initialize it from the GET `full.json` response (`state.isFullEditor` already distinguishes this fetch path — see `BaseCharacterEditController.js`'s `isFullEditor`/`usePlayerEndpoint` logic), an `onHiddenChange` handler that flips it, and include `hidden` in the PATCH payload sent to `full.json` alongside the other DM/admin-only fields (`name`, `role`, `money`, `private_description`).

### Step 3 — Icon registry

Add to `frontend/assets/js/utils/ui/Icons.js`:

```js
eyeSlashFill: 'bi-eye-slash-fill',
```

### Step 4 — "Hidden" tooltip badge

In `frontend/assets/js/components/common/helpers/CharacterStatusBadges.js`, add a new method and wire it into `build()`, NPC-only (mirroring the existing `!character.is_pc` guard around the allegiance items):

```js
static build(character) {
  const items = [
    CharacterStatusBadges.buildSlain(character),
    CharacterStatusBadges.buildPublicSlain(character),
  ];

  if (!character.is_pc) {
    items.push(
      CharacterStatusBadges.buildAllegiance(character),
      CharacterStatusBadges.buildPublicAllegiance(character),
      CharacterStatusBadges.buildHidden(character),
    );
  }

  return items.filter((item) => item !== null);
}

static buildHidden(character) {
  if (!character.hidden) {
    return null;
  }

  return {
    icon: Icons.eyeSlashFill,
    text: Translator.t('character_status_badges.hidden'),
    variant: null,
  };
}
```

No changes needed to `InfoBarRules.js` — it already calls `CharacterStatusBadges.build(character)` wholesale, so the new item automatically appears in the info bar wherever it's already rendered (`CharacterCardHelper.jsx:168,186`, `CharacterAvatarHelper.jsx:39` — covering the game page NPC list, NPC list page, and NPC detail page named in the issue).

`variant: null` already renders at exactly `#dedede` today, via `InfoBadgeList.jsx`'s existing `item.variant ? ... : 'info-badge-list-item-neutral'` fallback (`frontend/assets/css/main.scss:116-118`, `.info-badge-list-item-neutral { color: #dedede; }`). Per the issue discussion, this reuses the neutral-variant class rather than adding a one-off custom-color escape hatch, to avoid introducing new styling machinery for a color the app already renders identically elsewhere — flag this explicitly in the PR description as an intentional simplification, not an oversight, in case a reviewer expects a literal `color: '#dedede'` prop.

### Step 5 — Photo transparency

Add to `frontend/assets/css/main.scss` (near the existing `.photo-grayscale` rule, ~line 107):

```scss
.photo-hidden .card-photo-square img {
  opacity: 0.8;
}
```

Thread a new `dimmed` boolean prop through the avatar-overlay chain, mirroring how `grayscale` already works end to end:
- `ActionsOverlay.jsx`: add `dimmed = false` to props, and extend the class string: `` `actions-overlay${grayscale ? ' photo-grayscale' : ''}${dimmed ? ' photo-hidden' : ''}` ``.
- `CharacterAvatarField.jsx` / `CharacterAvatarFieldHelper.jsx`: add a `dimmed` prop and forward it to `ActionsOverlay`.
- Edit NPC form: pass `dimmed={state.hidden}` on `<CharacterAvatarField .../>` in `BaseCharacterEditHelper.jsx` (live preview dims as soon as the switch is toggled on, before saving).
- New NPC form: pass `dimmed={formState.hidden}` on `<CharacterAvatarField .../>` in `GameNpcNewHelper.jsx`.
- DM/admin "all NPCs" list cards: pass `dimmed={character.hidden}` alongside the existing `grayscale={character.slain}` on the `<ActionsOverlay .../>` in `CharacterCardHelper.jsx` (~line 182) — this is the "Character lists" transparency the issue asks for, scoped to the DM/admin all-NPCs view per the issue discussion (public users never see hidden NPCs in a list at all, so this is the only list where the effect can ever be visible). `character.hidden` is only present on `CharacterFullListSerializer` responses (DM/admin fetch), so it's naturally `undefined`/falsy for public-list cards — no extra gating needed.

### Step 6 — "Hidden" filter on the NPC list page

In `frontend/assets/js/components/resources/character/pages/elements/NpcFilters.jsx`/`NpcFiltersController.js`/`NpcFiltersHelper.jsx`, add a `hidden` filter following the exact `status`/`allegiance` dropdown pattern (blank / shown / hidden), and gate its rendering on a new `canEdit` prop passed down from `GameNpcs.jsx` (the page already tracks `canEdit` via `GameNpcsController`'s `setCanEdit`, currently only used to gate the "New NPC" button) — render the dropdown only when `canEdit` is true, matching the issue's "for admin and dm only" requirement. Wire `buildQuery`'s output `hidden` key straight through to `GameNpcsController#fetchNpcsAll`'s existing `filterParams` spread (`GameNpcsController.js:117`) — no controller change needed there since it already forwards whatever `getFilterParams()`/`buildQuery` produce.

### Step 7 — Specs

Add/extend Jasmine specs under `frontend/specs/assets/js/...` mirroring each changed file's existing spec (`GameNpcNewHelperSpec.js`, `BaseCharacterEditHelperSpec.js`, `CharacterStatusBadgesSpec.js`, `CharacterCardHelperSpec.js`, `NpcFiltersSpec.js`/`NpcFiltersControllerSpec.js`/`NpcFiltersHelperSpec.js`, `ActionsOverlaySpec.js` if one exists) covering: switch renders/hidden for NPC-only + DM/admin-only gating, hidden badge appears only when `character.hidden` is true, `dimmed` prop toggles the `photo-hidden` class, and the new filter dropdown is hidden for non-editors.

## Files to Change

- `frontend/assets/js/components/resources/character/pages/helpers/GameNpcNewHelper.jsx` — reposition/restyle hidden switch
- `frontend/assets/js/components/resources/character/pages/helpers/BaseCharacterEditHelper.jsx` — add `#renderHiddenField`
- `frontend/assets/js/components/resources/character/pages/helpers/NpcCharacterEditHelper.jsx` / its controller — wire `hidden` state, prefill from GET, include in PATCH payload
- `frontend/assets/js/utils/ui/Icons.js` — add `eyeSlashFill`
- `frontend/assets/js/components/common/helpers/CharacterStatusBadges.js` — add `buildHidden`
- `frontend/assets/js/components/common/ActionsOverlay.jsx` — add `dimmed` prop/class
- `frontend/assets/js/components/resources/character/pages/elements/CharacterAvatarField.jsx` — forward `dimmed`
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterAvatarFieldHelper.jsx` — forward `dimmed`
- `frontend/assets/js/components/common/helpers/CharacterCardHelper.jsx` — pass `dimmed={character.hidden}`
- `frontend/assets/css/main.scss` — add `.photo-hidden` rule
- `frontend/assets/js/components/resources/character/pages/elements/NpcFilters.jsx`, `.../controllers/NpcFiltersController.js`, `.../helpers/NpcFiltersHelper.jsx` — add hidden filter
- `frontend/assets/js/components/resources/character/pages/controllers/GameNpcsController.js` / `GameNpcs.jsx` — pass `canEdit` down to `NpcFilters`
- Corresponding spec files under `frontend/specs/...`

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend/`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`) — required since `translator.md` adds new keys

## Notes

- `BaseCharacterEditHelper` is shared with the PC edit page — double-check (e.g. via the `pc_edit_page` namespace instantiation) that `#renderHiddenField`'s `idPrefix !== 'npc'` guard is airtight, so the switch never leaks onto PC edit forms.
- The exact controller/page file backing `NpcCharacterEditHelper` wasn't pinned down by name in planning — locate it via `grep -rl NpcCharacterEditHelper frontend/assets/js` before starting Step 2.

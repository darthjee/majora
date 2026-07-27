# Frontend Plan: Players should be able to create NPCs

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" for the exact new route (`POST /games/<slug>/
npcs/full.json`), the new `can_create_npc` field on `GamePermissionsSerializer`, and the
`NpcPlayerCreateSerializer` field set (`name`, `role`, `public_description`,
`public_allegiance`, `public_slain`, `links`) this plan's requests must produce. `public_slain`
is accepted by the backend but not exposed as a form field on either the full or reduced create
form (the existing full create form has no slain toggle either — a brand-new NPC is never
slain — so neither payload needs to send it).

## Key finding: the slot-based form already splits on `isFullEditor`

`GameNpcNewHelper.jsx` already renders the creation form through `ShowPageLayout`
(`type="npc" mode="new"`), the exact same shared slot components (`CharacterHiddenSlot`,
`CharacterAllegianceFieldsSlot`, `CharacterDmNotesSlot`/private-description,
`CharacterMoneySlot`) the NPC **edit** page already uses — and every one of those slots already
gates its private/full-only field on an `isFullEditor` prop (`CharacterHiddenSlot.jsx:17`,
`CharacterAllegianceFieldsSlot.jsx:35`, `CharacterMoneySlot.jsx:54`). `GameNpcNewHelper.jsx`
currently just hardcodes `isFullEditor: true` (line 39), with a comment stating creation is
"always performed by a full editor" — that assumption is exactly what issue #868 breaks. **No
slot component needs to change at all** — only `GameNpcNewHelper.jsx`'s hardcoded value, and the
plumbing that feeds it a real, permission-derived boolean.

## Implementation Steps

### Step 1 — `npcConfig.js`: split `POST.collection`

`frontend/assets/js/utils/requests/config/npcConfig.js:46,68` currently has a single `create`
object shared by `regular`/`private` (`permission: 'can_edit'`, no restricted/full split — its
own file-header doc comment says so explicitly). Split it the same way `patchRegular`/
`patchPrivate` already are:

```js
const createRegular = { path: ({ gameSlug }) => `/games/${gameSlug}/npcs.json`, permission: 'can_create_npc' };
const createPrivate = { path: ({ gameSlug }) => `/games/${gameSlug}/npcs/full.json`, permission: 'can_edit' };
```

```js
POST: {
  single: { regular: photoUploadInit, private: photoUploadInit },
  collection: { regular: createRegular, private: createPrivate },
},
```

Update the file's header doc comment's `POST.collection` bullet to describe the new split
instead of "no restricted/full variant". No `RequestPermissionResolvers.js` change is needed —
`npc.collection`'s resolver already calls `AccessStore.ensureGamePermissions(gameSlug)`, which
will carry `can_create_npc` once the backend change lands.

### Step 2 — `GameNpcNewController.js`: allow reduced access, resolve `isFullEditor`

`#redirectIfNotAllowed` (`GameNpcNewController.js:156-160`) currently redirects away unless
`permissions.can_edit`. Change it to redirect only when **neither** flag grants access, and to
report which kind of access was granted:

```js
#redirectIfNotAllowed(permissions, gameSlug) {
  if (!permissions.can_edit && !permissions.can_create_npc) {
    this.#redirectToNpcs(gameSlug);
    return;
  }
  this.setIsFullEditor(Boolean(permissions.can_edit));
}
```

Add a `setIsFullEditor` constructor param (defaulting to `Noop.noop`), mirroring the existing
`setGameType` param's shape/position, stored as `this.setIsFullEditor`.

`submitForm` (`GameNpcNewController.js:106-138`) currently always builds the full-fields body.
Add an `isFullEditor = true` parameter (mirroring `BaseCharacterEditController.submitForm`'s own
default-`true` parameter, for the same reason: existing callers that don't pass it keep today's
dm/admin/superuser-only behavior), and branch the body:

```js
async submitForm(event, gameSlug, formValues, setters, isFullEditor = true) {
  ...
  const body = isFullEditor
    ? {
      name: formValues.name,
      role: formValues.role,
      public_description: formValues.description,
      private_description: formValues.privateDescription,
      hidden: formValues.hidden,
      money: parseInt(formValues.money, 10),
      private_allegiance: formValues.privateAllegiance,
      public_allegiance: formValues.publicAllegiance,
      links: formValues.links ?? [],
    }
    : {
      name: formValues.name,
      role: formValues.role,
      public_description: formValues.description,
      public_allegiance: formValues.publicAllegiance,
      links: formValues.links ?? [],
    };

  const response = await RequestStore.mutate({
    componentName: 'GameNpcNewController',
    resource: 'npc',
    method: 'POST',
    quantityType: 'collection',
    params: { gameSlug },
    body,
    variantName: isFullEditor ? 'private' : 'regular',
  });
  ...
}
```

`variantName` is forced explicitly (not left to live permission resolution) for the same reason
`BaseCharacterEditController.handleSubmit` forces it: the caller already decided which fields
shape to send, and a live-permission re-check could otherwise pick a different variant than the
payload was built for.

### Step 3 — `GameNpcNew.jsx`: thread `isFullEditor` through

Add `const [isFullEditor, setIsFullEditor] = useState(false);` — default `false` (not `true`)
so a reduced-access creator never briefly sees full-only fields (`privateDescription`, `hidden`,
`money`, `privateAllegiance`) flash on screen before the permissions check resolves; the common
dm/admin/superuser case flips to `true` as soon as `buildEffect()`'s permissions promise
resolves, same tick as today's `gameType` fetch.

Pass `setIsFullEditor` into the controller's constructor call (new 7th positional arg, after
`setGameType`):

```js
new GameNpcNewController(Noop.noop, setFieldErrors, null, null, setGameType, null, setIsFullEditor)
```

Thread it to the helper and the submit handler:

```js
{ ...fields, links, gameType, isFullEditor, status, fieldErrors, profile_photo_path: photoPreviewUrl }
```

```js
const handleSubmit = (event) => controller.submitForm(
  event, gameSlug, { ...fields, links, photoFile }, { setStatus, setFieldErrors, setCharacterId }, isFullEditor,
);
```

### Step 4 — `GameNpcNewHelper.jsx`: stop hardcoding `isFullEditor`

Replace `isFullEditor: true` (line 39) with `isFullEditor: formState.isFullEditor` (accept it
from `formState` like every other field, rather than hardcoding it), and add `isFullEditor:
boolean` to the `formState` JSDoc param. Rewrite the doc comment's "`isFullEditor` is always
`true`... since creation is always performed by a full editor" sentence — no longer true after
#868 — to instead state that `isFullEditor` now reflects whether the current viewer is a full
(dm/admin/superuser) creator vs. a reduced-field player/staff creator, same meaning the edit
page's `isFullEditor` already carries.

### Step 5 — "New NPC" button: switch from `can_edit` to `can_create_npc`

`GameCharactersHelper.jsx:45` currently gates the button on `state.canEdit`, which on this page
is sourced from `ListPage`'s own internal `GET /npcs/all.json` vs `/npcs.json` resolution (issue
#864's `can_edit` game-level flag) — unrelated to creation, coincidentally reused. Add a new
`state.canCreateNpc` prop and switch the button's gate to it:

```jsx
<ConditionalComponent render={state.canCreateNpc}>
  <NewButton href={state.newHref}>
    {Translator.t('game_npcs_page.new_npc')}
  </NewButton>
</ConditionalComponent>
```

Leave `filtersProps={{ ..., canEdit: state.canEdit }}` untouched — the DM-only filter UI is
unrelated to NPC creation and keeps reading the real game-edit `canEdit`.

`GameNpcsAccessController.js` currently only resolves `is_player` via
`AccessStore.ensureGameAccess`. Add a second, independent resolution in the same effect for
`can_create_npc` via `AccessStore.ensureGamePermissions(gameSlug)`, mirroring the existing
`is_player` promise chain, with a new `setCanCreateNpc` constructor param (default
`Noop.noop`):

```js
AccessStore.ensureGamePermissions(this.gameSlug)
  .then((permissions) => {
    if (mounted) {
      this.setCanCreateNpc(Boolean(permissions.can_create_npc));
    }
  })
  .catch(() => {
    if (mounted) {
      this.setCanCreateNpc(false);
    }
  });
```

`GameNpcs.jsx`: add `const [canCreateNpc, setCanCreateNpc] = useState(false);`, pass
`setCanCreateNpc` into `new GameNpcsAccessController(gameSlug, setIsPlayer, setCanCreateNpc)`,
and add `canCreateNpc` to the state object passed to `GameCharactersHelper.render`.

## Files to Change

- `frontend/assets/js/utils/requests/config/npcConfig.js` — split `POST.collection`
- `frontend/assets/js/components/resources/character/pages/controllers/GameNpcNewController.js`
  — reduced-access redirect, `isFullEditor`-branched `submitForm`
- `frontend/assets/js/components/resources/character/pages/GameNpcNew.jsx` — `isFullEditor`
  state, threaded through
- `frontend/assets/js/components/resources/character/pages/helpers/GameNpcNewHelper.jsx` —
  stop hardcoding `isFullEditor`
- `frontend/assets/js/components/resources/character/pages/helpers/GameCharactersHelper.jsx` —
  `canCreateNpc`-gated "New NPC" button
- `frontend/assets/js/components/resources/character/pages/controllers/GameNpcsAccessController.js`
  — resolve `can_create_npc`
- `frontend/assets/js/components/resources/character/pages/GameNpcs.jsx` — wire `canCreateNpc`
  state through

## Tests

- `npcConfig`/`resourceConfig`-level spec (wherever `patchRegular`/`patchPrivate`'s split is
  already covered) — extend for `POST.collection`'s new `regular`/`private` paths and
  permissions.
- `GameNpcNewController` spec — cover `#redirectIfNotAllowed` for the new
  `can_create_npc`-only-true case (no redirect), and `submitForm` for both `isFullEditor` values
  (correct body shape, correct `variantName`, correct endpoint).
- `GameCharactersHelper`/`GameNpcs` specs — cover the "New NPC" button rendering on
  `canCreateNpc` instead of `canEdit`.
- `GameNpcNewHelper` spec (or a `ShowPageLayout`/slot-level spec, if that's where equivalent
  edit-mode coverage already lives) — confirm `isFullEditor: false` hides
  hidden/money/private-description/private-allegiance on the "new" NPC form, mirroring existing
  edit-mode coverage for the same slots.

## CI Checks

- `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)

## Notes

- No new i18n keys are needed — the "new"-mode slot components already carry their own i18n
  labels (used today when `isFullEditor` was hardcoded `true`); flipping the flag to `false` for
  some viewers only changes which existing labels render, not their text.
- Confirm whether a `PcCharacterNewController`/PC-creation equivalent exists before assuming
  `GameNpcNewController` is the only caller of `NpcPlayerCreateSerializer`-shaped bodies — per
  the issue and `character.md`, there is no PC creation endpoint at all, so no PC-side change is
  expected here.

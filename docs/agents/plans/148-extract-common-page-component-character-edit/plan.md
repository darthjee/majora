# Plan: Extract Common Page Component CharacterEdit

Issue: [148-extract-common-page-component-character-edit.md](../issues/148-extract-common-page-component-character-edit.md)

## Overview

Extract the duplicated character edit logic shared between `NpcCharacterEdit` and `PcCharacterEdit`
into three shared base abstractions: a `CharacterEdit` shared React component, a
`BaseCharacterEditHelper` instance class, and a `BaseCharacterEditController` base class.
The NPC and PC page components, helpers, and controllers are then reduced to thin wrappers
that supply only their type-specific details.

## Context

`NpcCharacterEdit.jsx` and `PcCharacterEdit.jsx` are byte-for-byte identical in their state
declarations, both `useEffect` calls, and their `handleSubmit` function. The same duplication
exists at the helper layer (`NpcCharacterEditHelper` / `PcCharacterEditHelper`) — they differ
only in their i18n key namespace (`npc_edit_page` vs `pc_edit_page`) and HTML field ID prefix
(`npc` vs `pc`). At the controller layer (`NpcCharacterEditController` /
`PcCharacterEditController`), `applyLoadedCharacter`, `submitForm`, `#handleResponse`, and
`buildEffect` are duplicated verbatim; only the inner load-controller class, the route segment
(`npcs` vs `pcs`), and the API method (`updateNpc` vs `updatePc`) differ.

## Implementation Steps

### Step 1 — Extract `BaseCharacterEditHelper`

Create `frontend/assets/js/components/pages/helpers/BaseCharacterEditHelper.jsx`.

This is an **instance class** (not static), accepting `idPrefix` (`'npc'` or `'pc'`) and
`i18nNamespace` (`'npc_edit_page'` or `'pc_edit_page'`) as constructor arguments.

Provide three instance methods (matching the interface the shared component will call):
- `render(state, handlers)` — renders the full edit form, using `this.idPrefix` for field IDs and `this.i18nNamespace` for translation keys.
- `renderLoading()` — returns `<LoadingMessage message={Translator.t('character_page.loading')} />`.
- `#renderError(state)` — returns `<ErrorAlert>` when `state.status === 'error'`, using `this.i18nNamespace` for the error key.

Update `NpcCharacterEditHelper.jsx` and `PcCharacterEditHelper.jsx` to delegate to
pre-built `BaseCharacterEditHelper` instances:

```js
// NpcCharacterEditHelper.jsx
import BaseCharacterEditHelper from './BaseCharacterEditHelper.jsx';
const NpcCharacterEditHelper = new BaseCharacterEditHelper('npc', 'npc_edit_page');
export default NpcCharacterEditHelper;
```

(Same pattern for `PcCharacterEditHelper` with `'pc'` and `'pc_edit_page'`.)

The existing helper specs test `NpcCharacterEditHelper.render(...)` and
`PcCharacterEditHelper.render(...)` — these must continue to pass unchanged, since they
call through to the base instance.

Write `BaseCharacterEditHelperSpec.js` testing the base class in isolation using an arbitrary
`idPrefix`/`i18nNamespace` pair (e.g. `'test'` / `'npc_edit_page'`), covering: all fields
rendered, avatar preview, per-field errors, error alert on `status === 'error'`,
submit disabled while `status === 'submitting'`, and `renderLoading`.

### Step 2 — Extract `BaseCharacterEditController`

Create `frontend/assets/js/components/pages/controllers/BaseCharacterEditController.js`.

This class extends `BasePageController`. Constructor signature:

```js
constructor(
  setCharacter, setLoading, setError, setFieldErrors = () => {},
  loadControllerClass,   // NpcCharacterController or PcCharacterController
  getParamsFromHash,     // getNpcCharacterEditParamsFromHash or getPcCharacterEditParamsFromHash
  routeSegment,          // 'npcs' or 'pcs'
  updateMethod,          // 'updateNpc' or 'updatePc'
  client = null,
  characterClient = null,
)
```

Implement shared logic:
- `buildEffect()` — delegates to `this.loadController.buildEffect()`.
- `applyLoadedCharacter(character, gameSlug, characterId, setters)` — identical to the current implementations (uses `resolveLoadedCharacter`).
- `submitForm(event, gameSlug, characterId, formValues, setters)` — identical to current implementations.
- `async handleSubmit(gameSlug, characterId, fields)` — calls `this.characterClient[this.updateMethod](...)`.
- `async #handleResponse(response, gameSlug, characterId)` — identical to current implementations (calls `this.#redirectToShow`).
- `#redirectToShow(gameSlug, characterId)` — uses `this.routeSegment` to build the hash, e.g. `/games/${gameSlug}/${this.routeSegment}/${characterId}`.

Move `resolveLoadedCharacter` out of `PcCharacterEditController.js` into
`BaseCharacterEditController.js` and export it from there. Update
`NpcCharacterEditController.js` to re-export from `BaseCharacterEditController.js` instead of
`PcCharacterEditController.js` (this fixes a circular re-export smell).

Update `NpcCharacterEditController.js` and `PcCharacterEditController.js` to extend
`BaseCharacterEditController`, passing their type-specific arguments to `super(...)`.
Retain the named exports `getNpcCharacterEditParamsFromHash` and
`getPcCharacterEditParamsFromHash` in their respective files (the shared component needs them).

The existing controller specs test through the concrete subclasses and must continue to pass
unchanged. Write `BaseCharacterEditControllerSpec.js` with a concrete test subclass
(`TestCharacterEditController`) that passes minimal spy dependencies, covering:
`applyLoadedCharacter` (null, redirect, seed-fields), `submitForm` (calls API + field errors),
and `buildEffect` (delegates to load controller).

### Step 3 — Extract `CharacterEdit` shared component

Create `frontend/assets/js/components/pages/shared/CharacterEdit.jsx` (and the corresponding
`frontend/specs/assets/js/components/pages/shared/` directory).

Props:
- `ControllerClass` — the edit controller class to instantiate (`NpcCharacterEditController` or `PcCharacterEditController`).
- `getParamsFromHash` — the hash-parsing function for this character type.
- `EditHelper` — a `BaseCharacterEditHelper` instance with `render` and `renderLoading` methods.

The shared component is the current body of `NpcCharacterEdit` / `PcCharacterEdit` with
`NpcCharacterEditController` → `ControllerClass`,
`getNpcCharacterEditParamsFromHash` → `getParamsFromHash`, and
`NpcCharacterEditHelper` → `EditHelper`:

```jsx
export default function CharacterEdit({ ControllerClass, getParamsFromHash, EditHelper }) {
  // ... all state declarations ...
  const controller = useMemo(() => new ControllerClass(...setters), []);
  const { game_slug: gameSlug, character_id: characterId } = getParamsFromHash(currentHash);
  // ... both useEffects ...
  // ... handleSubmit ...
  if (loading) return CharacterHelper.renderLoading();
  if (error)   return CharacterHelper.renderError(error);
  if (!character || !character.can_edit) return EditHelper.renderLoading();
  return EditHelper.render(state, handlers);
}
```

Reduce `NpcCharacterEdit.jsx` and `PcCharacterEdit.jsx` to thin wrappers:

```jsx
// NpcCharacterEdit.jsx
import CharacterEdit from './shared/CharacterEdit.jsx';
import NpcCharacterEditController, { getNpcCharacterEditParamsFromHash }
  from './controllers/NpcCharacterEditController.js';
import NpcCharacterEditHelper from './helpers/NpcCharacterEditHelper.jsx';

export default function NpcCharacterEdit() {
  return (
    <CharacterEdit
      ControllerClass={NpcCharacterEditController}
      getParamsFromHash={getNpcCharacterEditParamsFromHash}
      EditHelper={NpcCharacterEditHelper}
    />
  );
}
```

(Identically for `PcCharacterEdit.jsx` with PC variants.)

Write `CharacterEditSpec.js` that mounts `CharacterEdit` with spy
`ControllerClass`/`getParamsFromHash`/`EditHelper` props, covering: initial loading state,
renders via `EditHelper.render` once character is loaded.

The existing `NpcCharacterEditSpec.js` and `PcCharacterEditSpec.js` tests must continue to
pass unchanged.

## Files to Change

- `frontend/assets/js/components/pages/helpers/BaseCharacterEditHelper.jsx` — **new** shared helper instance class
- `frontend/assets/js/components/pages/helpers/NpcCharacterEditHelper.jsx` — reduce to delegating instance
- `frontend/assets/js/components/pages/helpers/PcCharacterEditHelper.jsx` — reduce to delegating instance
- `frontend/assets/js/components/pages/controllers/BaseCharacterEditController.js` — **new** shared base controller
- `frontend/assets/js/components/pages/controllers/NpcCharacterEditController.js` — extend base, fix re-export source
- `frontend/assets/js/components/pages/controllers/PcCharacterEditController.js` — extend base, move `resolveLoadedCharacter` to base
- `frontend/assets/js/components/pages/shared/CharacterEdit.jsx` — **new** shared page component
- `frontend/assets/js/components/pages/NpcCharacterEdit.jsx` — reduce to thin wrapper
- `frontend/assets/js/components/pages/PcCharacterEdit.jsx` — reduce to thin wrapper
- `frontend/specs/assets/js/components/pages/helpers/BaseCharacterEditHelperSpec.js` — **new** spec
- `frontend/specs/assets/js/components/pages/controllers/BaseCharacterEditControllerSpec.js` — **new** spec
- `frontend/specs/assets/js/components/pages/shared/CharacterEditSpec.js` — **new** spec

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)

## Notes

- The existing `NpcCharacterEditSpec` and `PcCharacterEditSpec` spy on `NpcCharacterEditController.prototype.buildEffect` and `PcCharacterEditController.prototype.buildEffect`. After the refactor, those methods live on `BaseCharacterEditController.prototype` — but since the spy target is the subclass prototype chain, `spyOn(NpcCharacterEditController.prototype, 'buildEffect')` will still resolve through the prototype chain. Verify this passes without changes.
- The `resolveLoadedCharacter` re-export from `NpcCharacterEditController` must be updated to point to `BaseCharacterEditController` instead of `PcCharacterEditController`. Any existing spec importing it from `NpcCharacterEditController` must continue to work.
- Run `docker-compose run --rm majora_fe yarn test` and `docker-compose run --rm majora_fe yarn lint` after each step to catch regressions early.

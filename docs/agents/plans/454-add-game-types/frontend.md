# Frontend Plan: Add game types

Main plan: [plan.md](plan.md)

## Shared contracts

- `POST /games.json` accepts an optional `game_type` field (`'dnd'` | `'deadlands'`); this
  form always sends it explicitly.
- `game_new_page.game_type_label` is a translation key the `translator` agent adds to
  `en.yaml`/`pt.yaml` — call `Translator.t('game_new_page.game_type_label')` for the field
  label. The two dropdown **option** labels ("D&D" / "Deadlands") are hardcoded, untranslated
  strings — do not route them through `Translator`.

## Implementation Steps

### Step 1 — Add `gameType` state to `GameNew.jsx`

In `frontend/assets/js/components/resources/game/pages/GameNew.jsx`, add
`const [gameType, setGameType] = useState('dnd');` (default mirrors the backend model
default), pass `gameType` into `formState` and `game_type: gameType` into
`handleSubmit`'s `{ name, description }` object (rename that call site's payload to
include the new field), and add an `onGameTypeChange` handler
(`(event) => setGameType(event.target.value)`) passed through to the helper alongside
`onNameChange`/`onDescriptionChange`.

### Step 2 — Add the dropdown to `GameNewHelper.jsx`

In `frontend/assets/js/components/resources/game/pages/helpers/GameNewHelper.jsx`, add a
`<select>` between the description `FormField` and the submit button. `FormField` only
renders `<input>` (see `frontend/assets/js/components/common/FormField.jsx`), so don't
reuse it — instead render a plain `<select>` inline, following the structure of
`LanguageSelectorHelper` (`frontend/assets/js/components/common/helpers/LanguageSelectorHelper.jsx:15-31`)
for the untranslated-option pattern, wrapped in the same `mb-3`/`form-label` markup
`FormField` uses so it looks consistent with the rest of the form:

```jsx
<div className="mb-3">
  <label htmlFor="game-new-type" className="form-label">
    {Translator.t('game_new_page.game_type_label')}
  </label>
  <select
    id="game-new-type"
    className="form-select"
    value={formState.gameType}
    onChange={handlers.onGameTypeChange}
  >
    <option value="dnd">D&amp;D</option>
    <option value="deadlands">Deadlands</option>
  </select>
</div>
```

Update the JSDoc `@param` blocks for `formState`/`handlers` to include `gameType` /
`onGameTypeChange`.

### Step 3 — Pass `game_type` through the controller

In
`frontend/assets/js/components/resources/game/pages/controllers/GameNewController.js`,
update `submitForm`'s `formValues` JSDoc and `#performCreate` to include `game_type:
formValues.gameType` in the object passed to `this.gameClient.createGame(...)`. No change
needed in `GameClient.createGame` itself (`frontend/assets/js/client/GameClient.js:51-53`)
— it already forwards whatever `fields` object it's given.

### Step 4 — Tests

- `frontend/specs/assets/js/components/resources/game/pages/helpers/GameNewHelperSpec.js`:
  assert the dropdown renders with both options and the correct (untranslated) option
  text, and that changing it calls `onGameTypeChange`.
- `frontend/specs/assets/js/components/resources/game/pages/controllers/GameNewController/submitFormSpec.js`
  (and its `support.js` fixture): assert `game_type` is included in the payload sent to
  `createGame`.
- Check for an existing `GameNew`-level spec (if any, alongside `GameNew.jsx`) that
  exercises the full state wiring, and add `gameType`/`onGameTypeChange` coverage there
  too if such a spec file exists.

## CI Checks

- `frontend`: `npm test` / `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- Keep the dropdown's default selection (`dnd`) in sync with the backend model default —
  both are hardcoded to `'dnd'` independently; there's no shared constant to import across
  the frontend/backend boundary in this codebase.

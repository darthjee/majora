# Frontend Plan: Add money edit on NPC creation

Main plan: [plan.md](plan.md)

## Shared contracts

Relies on the translator agent adding/updating these keys in `frontend/assets/i18n/{en,pt}.yaml` under `game_npc_new_page`:

- `edit_money_button` (new) — used as `CharacterMoneyField`'s `buttonLabel`.
- `money_label` (existing, value updated to drop the parenthetical) — used as `CharacterMoneyField`'s `label`.

If the translator agent's change isn't present yet when this work starts, add both keys directly in `en.yaml`/`pt.yaml` with the exact values from [plan.md](plan.md)'s "Shared contracts" section — do not block on ordering.

## Implementation Steps

### Step 1 — Fetch `game_type` on the NPC creation page

Mirror `GameTreasureNewController` (`frontend/assets/js/components/resources/treasure/pages/controllers/GameTreasureNewController.js`) in `frontend/assets/js/components/resources/character/pages/controllers/GameNpcNewController.js`:

- Import `GameClient` from `../../../../../client/GameClient.js`.
- Add a `setGameType = Noop.noop` constructor param and a `gameClient = null` constructor param (`this.gameClient = gameClient ?? new GameClient();`). Keep existing constructor params (`setError`, `setFieldErrors`, `characterClient`) in place — append the two new ones at the end, same order `GameTreasureNewController` uses relative to its own existing params.
- Add a `fetchGameType(gameSlug, token)` method identical in shape to `GameTreasureNewController#fetchGameType` (resolves the game's `game_type`, defaults to `'dnd'` on any failure/non-ok response).
- In `buildEffect()`, alongside the existing `AccessStore.ensureGamePermissions(...)` call, add:
  `this.fetchGameType(gameSlug, AuthStorage.getToken()).then((gameType) => this.setGameType(gameType));`
  (`AuthStorage` is already imported.)

In `frontend/assets/js/components/resources/character/pages/GameNpcNew.jsx`:

- Add `const [gameType, setGameType] = useState('dnd');`.
- Pass `setGameType` into the `GameNpcNewController` constructor at the correct new positional slot (matching the updated constructor signature above).
- Pass `gameType` down into `GameNpcNewHelper.render`'s state object.

### Step 2 — Add money modal state and wiring

In `GameNpcNew.jsx`, mirroring `CharacterEdit.jsx`'s `MoneyEditModal` wiring:

- Add `const [showMoneyModal, setShowMoneyModal] = useState(false);`.
- Add an `onOpenMoneyModal: () => setShowMoneyModal(true)` handler passed into `GameNpcNewHelper.render`.
- Render a `<MoneyEditModal>` alongside the existing `<LinksEditModal>`/`<PhotoUploadModal>`:
  ```jsx
  <MoneyEditModal
    show={showMoneyModal}
    money={fields.money}
    context="character"
    gameType={gameType}
    onClose={() => setShowMoneyModal(false)}
    onConfirm={(newTotal) => {
      setField('money', String(newTotal));
      setShowMoneyModal(false);
    }}
  />
  ```
  (Add `setField` to `GameNpcNew.jsx`'s `useFormState` destructure — see the Notes section below for why `handleChange('money')` is not usable here, and remove the now-unused `onMoneyChange: handleChange('money')` handler/prop wired to the old raw input.)

### Step 3 — Replace the raw money input with `CharacterMoneyField`

In `frontend/assets/js/components/resources/character/pages/helpers/GameNpcNewHelper.jsx`:

- Remove the standalone `FormField` money input (currently between the `row` div and `#renderAllegianceFields`).
- Import `CharacterMoneyField` from `../elements/CharacterMoneyField.jsx`.
- In `#renderAvatarColumn`, add `CharacterMoneyField` right after `CharacterLinksField` (mirroring `BaseCharacterEditHelper.jsx`'s layout order: avatar → hidden toggle → name → links → money → allegiance):
  ```jsx
  <CharacterMoneyField
    isFullEditor
    label={Translator.t('game_npc_new_page.money_label')}
    money={formState.money}
    treasureValue={0}
    gameType={formState.gameType}
    buttonLabel={Translator.t('game_npc_new_page.edit_money_button')}
    onOpenMoneyModal={handlers.onOpenMoneyModal}
    errors={formState.fieldErrors.money ?? []}
  />
  ```
  `isFullEditor` is hardcoded `true` (not passed through `formState`) — the NPC creation page's own access check (`GameNpcNewController#buildEffect`) already redirects any non-full-editor away before this ever renders, so there is no separate visibility concern here (unlike the edit page, which is reachable by NPC player-editors too).
- Update the component doc comment (lines 19-26) — it currently states money "stays a raw number field below the columns" because there's no id to scope a breakdown to; that reasoning still applies to treasures/photos (out of scope here) but no longer to money, since `MoneyEditModal`'s local-state confirm pattern doesn't need an id. Update the JSDoc `@param` type for `formState` to include `gameType: string` and drop the now-inaccurate money sentence, keeping the note about avatar/photo deferred upload as-is.
- Add `onOpenMoneyModal: Function` to the `handlers` JSDoc.

### Step 4 — Update specs

- `frontend/specs/assets/js/components/resources/character/pages/helpers/GameNpcNewHelperSpec.js` — replace assertions on the raw money `FormField` with assertions on `CharacterMoneyField`'s props (money, treasureValue, gameType, label, buttonLabel, errors) and the `onOpenMoneyModal` handler wiring, mirroring `frontend/specs/assets/js/components/resources/treasure/pages/helpers/GameTreasureNewHelperSpec.js`'s style for `TreasureValueField`.
- `frontend/specs/assets/js/components/resources/character/pages/GameNpcNewSpec.js` — add coverage for the money modal open/confirm/close flow, mirroring `frontend/specs/assets/js/components/resources/treasure/pages/GameTreasureNewSpec.js`'s `MoneyEditModal` coverage. Update the `GameNpcNewController` construction spy/expectations for the new constructor params.
- `frontend/specs/assets/js/components/resources/character/pages/controllers/GameNpcNewController/buildEffectSpec.js` — add coverage that `fetchGameType`/`setGameType` gets called, mirroring `frontend/specs/assets/js/components/resources/treasure/pages/controllers/GameTreasureNewController/buildEffectSpec.js`.
- Add a new `frontend/specs/assets/js/components/resources/character/pages/controllers/GameNpcNewController/fetchGameTypeSpec.js`, mirroring `frontend/specs/assets/js/components/resources/treasure/pages/controllers/GameTreasureNewController/fetchGameTypeSpec.js` (default-to-`'dnd'` on failure, resolves actual `game_type` on success).
- Leave `GameNpcNewLinksSpec.js` and `submitFormSpec.js`/`submitFormPhotoUploadSpec.js`/`retryPhotoUploadSpec.js` untouched — `submitForm`'s payload shape (`money: parseInt(formValues.money, 10)`) is unchanged.

## Files to Change

- `frontend/assets/js/components/resources/character/pages/controllers/GameNpcNewController.js` — add `GameClient`, `setGameType`, `fetchGameType`, wire into `buildEffect`.
- `frontend/assets/js/components/resources/character/pages/GameNpcNew.jsx` — add `gameType`/`showMoneyModal` state, `MoneyEditModal`, `onOpenMoneyModal` handler.
- `frontend/assets/js/components/resources/character/pages/helpers/GameNpcNewHelper.jsx` — remove raw money `FormField`, add `CharacterMoneyField` to `#renderAvatarColumn`, update JSDoc.
- `frontend/specs/assets/js/components/resources/character/pages/helpers/GameNpcNewHelperSpec.js` — update money-field assertions.
- `frontend/specs/assets/js/components/resources/character/pages/GameNpcNewSpec.js` — add money modal flow coverage.
- `frontend/specs/assets/js/components/resources/character/pages/controllers/GameNpcNewController/buildEffectSpec.js` — add `fetchGameType`/`setGameType` coverage.
- `frontend/specs/assets/js/components/resources/character/pages/controllers/GameNpcNewController/fetchGameTypeSpec.js` — new file, mirrors the treasure controller's spec.

## CI Checks

- `frontend`: `npm test` / `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- No backend or API changes: `POST /games/:slug/npcs.json`'s `money` field is unaffected — it already accepts a plain integer, unchanged by this issue.
- `CharacterMoneyField` already defaults `treasureValue` to `0` when omitted, but pass `treasureValue={0}` explicitly per the issue's stated expected behavior for readability/intent, matching `GameTreasureNewHelper.jsx`'s style of being explicit about game-type-derived props.
- `useFormState.js` exposes `setField(field, value)` precisely for this case ("for values that don't come from a DOM change event, e.g. a modal's confirm callback" — see its own JSDoc). `GameNpcNew.jsx` currently destructures `{ state: fields, handleChange, handleCheckboxChange }`; add `setField` to that destructure and use `setField('money', String(newTotal))` in the `MoneyEditModal`'s `onConfirm` (Step 2), exactly like `CharacterEdit.jsx` does. Do not reuse `handleChange('money')` for this — it expects a DOM event (`onMoneyChange: handleChange('money')` stays wired to nothing now, since the raw `FormField` is removed in Step 3; drop that handler entirely).

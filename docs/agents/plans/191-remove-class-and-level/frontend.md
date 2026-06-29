# Frontend Plan: Remove Class and Level

Main plan: [plan.md](plan.md)

## Shared contracts

This agent consumes the API contract produced by `backend`:

- `character_class` and `level` are removed from the character detail JSON response.
- `role` (string, nullable) is added to the character detail JSON response.
- `CharacterUpdateSerializer` now accepts `role` instead of `character_class`/`level`.

This agent also relies on the i18n keys produced by `translator`:

```yaml
character_info:
  role_label: 'Role:'

pc_edit_page:
  role_label: Role

npc_edit_page:
  role_label: Role
```

## Implementation Steps

### Step 1 — Update CharacterInfoHelper

In `frontend/assets/js/components/elements/helpers/CharacterInfoHelper.jsx`:
- Change `render(name, character_class, level, description)` signature to `render(name, role, description)`.
- Rename private method `#renderClassLevel` to `#renderRole`.
- Update `#renderRole` to render `role` only (not a class+level pair): show if `role` is truthy, using `Translator.t('character_info.role_label')`.

### Step 2 — Update CharacterInfo

In `frontend/assets/js/components/elements/CharacterInfo.jsx`:
- Change prop signature from `{ name, character_class, level, description }` to `{ name, role, description }`.
- Pass `role` instead of `character_class, level` to `CharacterInfoHelper.render(...)`.
- Update JSDoc accordingly.

### Step 3 — Update BaseCharacterEditHelper

In `frontend/assets/js/components/pages/helpers/BaseCharacterEditHelper.jsx`:
- Remove the `FormField` for `character_class` and the `FormField` for `level`.
- Add a `FormField` for `role` (type `text`, label `Translator.t(\`${i18nNamespace}.role_label\`)`, value `state.role`, onChange `handlers.onRoleChange`, errors `state.fieldErrors.role ?? []`).
- Update JSDoc.

### Step 4 — Update CharacterEdit

In `frontend/assets/js/components/pages/shared/CharacterEdit.jsx`:
- Remove `useState` for `characterClass` and `level`.
- Add `useState` for `role` (initial value `''`).
- Remove calls to `setCharacterClass` and `setLevel` in `applyLoadedCharacter`.
- Add `setRole` to the setters passed to `controller.applyLoadedCharacter`.
- Update `handleSubmit` payload: remove `characterClass`/`level`, add `role`.
- Update the `EditHelper.render(...)` call: remove `character_class`/`level` from state, add `role`; remove `onCharacterClassChange`/`onLevelChange` handlers, add `onRoleChange`.

### Step 5 — Update BaseCharacterEditController

In `frontend/assets/js/components/pages/controllers/BaseCharacterEditController.js`:
- In `resolveLoadedCharacter`: replace `character_class` and `level` fields with `role`.
- In `submitForm`: replace `character_class: formValues.characterClass` and `level: formValues.level` with `role: formValues.role`.
- In `applyLoadedCharacter`: replace `setters.setCharacterClass(fields.character_class)` and `setters.setLevel(fields.level)` with `setters.setRole(fields.role)`.
- Update JSDoc.

### Step 6 — Update specs

Update any Jasmine spec files that reference `character_class`, `level`, `characterClass`, `setCharacterClass`, `setLevel`, or related i18n keys:

- Spec files under `frontend/assets/js/` that test `CharacterInfoHelper`, `CharacterInfo`, `BaseCharacterEditHelper`, `CharacterEdit`, or `BaseCharacterEditController` must be updated to use `role` / `setRole` / `onRoleChange`.

Find relevant spec files:
```bash
grep -rl "character_class\|characterClass\|setCharacterClass\|setLevel\|level_label\|class_label" frontend/assets/js/ --include="*.spec.*"
```

### Step 7 — Run checks locally

```bash
docker-compose run --rm frontend yarn test
docker-compose run --rm frontend yarn lint
```

Fix any failures before committing.

### Step 8 — Commit

```bash
scripts/commit_change.sh "feat(frontend): replace character_class/level with role field (issue #191)" "claude-sonnet-4-6" "claude-sonnet-4-6@anthropic.com"
```

> Resolve `commit_change.sh` relative to the `auto-fix-issue` skill folder.

## Files to Change

- `frontend/assets/js/components/elements/CharacterInfo.jsx` — update props and delegate call
- `frontend/assets/js/components/elements/helpers/CharacterInfoHelper.jsx` — replace class/level render with role
- `frontend/assets/js/components/pages/helpers/BaseCharacterEditHelper.jsx` — replace class/level fields with role field
- `frontend/assets/js/components/pages/shared/CharacterEdit.jsx` — replace useState/handlers for class+level with role
- `frontend/assets/js/components/pages/controllers/BaseCharacterEditController.js` — replace class/level fields with role in resolveLoadedCharacter, submitForm, applyLoadedCharacter
- Jasmine spec files for the above components (to be discovered via grep)

## CI Checks

- `frontend/`: `docker-compose run --rm frontend yarn test` (CI job: `frontend-tests`)
- `frontend/`: `docker-compose run --rm frontend yarn lint` (CI job: `frontend-lint`)

## Notes

- `CharacterListSerializer` is not changed, so character list components need no update.
- The `role` field should only be shown in `CharacterInfoHelper` when the value is truthy (same guard as the old class check).
- Do not touch `CharacterHelper.jsx` — it does not reference class/level.

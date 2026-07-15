# Translator Plan: Add game types

Main plan: [plan.md](plan.md)

## Shared contracts

- Add exactly one new key, `game_type_label`, to the existing `game_new_page` namespace
  in both `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`, alongside the
  namespace's current `name_label`/`description_label` keys
  (`frontend/assets/i18n/en.yaml:169-174`). The `frontend` agent calls
  `Translator.t('game_new_page.game_type_label')` for the dropdown's field label.
- Do **not** add translation keys for the dropdown's option text ("D&D" / "Deadlands") —
  the issue explicitly states those are not translated; the frontend hardcodes them.

## Implementation Steps

### Step 1 — Add the `en.yaml` key

In `frontend/assets/i18n/en.yaml`, under the existing `game_new_page:` block
(`frontend/assets/i18n/en.yaml:169-174`), add:

```yaml
  game_type_label: Game type
```

placed after `description_label` and before `submit`, matching the existing field-label
ordering (name, description, then submit/error).

### Step 2 — Add the matching `pt.yaml` key

Add the equivalent Portuguese translation under `pt.yaml`'s `game_new_page:` block, in the
same position, so both locale files stay structurally in sync.

### Step 3 — Verify sync

Run the translation-key sync check to confirm both files stay aligned.

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- This is a small, single-key addition — no new namespace is needed since `game_new_page`
  already exists and the field only appears on the creation form.

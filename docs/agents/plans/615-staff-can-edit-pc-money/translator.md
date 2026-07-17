# Translator Plan: Staff Can Edit Pc Money

Main plan: [plan.md](plan.md)

## Shared contracts

`frontend`'s `CharacterMoneyHelper.jsx` renders the new show-page edit link via
`Translator.t('character_page.edit_money_button')` — this key must exist in every language file
before `frontend`'s work can pass `npm run check_i18n`.

## Implementation Steps

### Step 1 — Add the new key

Add `edit_money_button` under the existing `character_page:` block in both language files,
matching the wording already used by the edit page's own button (`pc_edit_page.edit_money_button`
/ `npc_edit_page.edit_money_button`):

`frontend/assets/i18n/en.yaml` (under `character_page:`, alongside `edit:`):

```yaml
character_page:
  ...
  edit_money_button: Edit money
```

`frontend/assets/i18n/pt.yaml` (same position):

```yaml
character_page:
  ...
  edit_money_button: Editar dinheiro
```

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `character_page.edit_money_button`
- `frontend/assets/i18n/pt.yaml` — add `character_page.edit_money_button`

## CI Checks

- `frontend`: `docker-compose run frontend npm run check_i18n` (CI job: `frontend-checks`) — verifies key parity across language files

## Notes

- Only one new key is needed; no other user-facing copy is introduced by this issue (the modal
  itself, its fields, and its own "Edit money" trigger on the edit page already have
  translations under `money_edit_modal`/`pc_edit_page`/`npc_edit_page`).

# Translator Plan: Add Game Item Creation Page

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend agent (see [frontend.md](frontend.md)) updates the JS constants that reference
these translation keys in the same PR — this rename must land together with that change, or
`check_i18n`/the running app breaks.

## Implementation Steps

### Step 1 — Rename the item-creation-form namespace

In both `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`, rename the
`character_item_new_page` top-level key to `item_new_page`, keeping every nested key and value
exactly as-is (`title`, `name_label`, `description_label`, `hidden_label`, `submit`, `error`).
This is a pure key rename — the form (`name`/`description`/`hidden` fields, "Create Item" title)
is already shared across game/PC/NPC item creation via `itemShowType.js`, so keeping a
`character_`-prefixed namespace is no longer accurate; `item_edit_page` already uses the
equivalent generic naming for the edit-mode counterpart.

en.yaml, before:
```yaml
character_item_new_page:
  title: Create Item
  name_label: Name
  description_label: Description
  hidden_label: Hidden
  submit: Create Item
  error: Failed to create item. Please try again.
```
after: same block, key renamed to `item_new_page`.

pt.yaml, before:
```yaml
character_item_new_page:
  title: Criar Item
  name_label: Nome
  description_label: Descrição
  hidden_label: Oculto
  submit: Criar Item
  error: Falha ao criar o item. Tente novamente.
```
after: same block, key renamed to `item_new_page`.

### Step 2 — Add the list-page link label

Add a `create_item` key to the existing `game_items_page` namespace in both files:

- `en.yaml`: `create_item: Create Item`
- `pt.yaml`: `create_item: Criar Item`

### Step 3 — Verify sync

Run `npm run check_i18n` locally to confirm both languages still have matching key sets after
the rename and addition.

## Files to Change

- `frontend/assets/i18n/en.yaml`
- `frontend/assets/i18n/pt.yaml`

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- Do not change any wording/content of the renamed namespace — only the key name changes.
- The frontend agent depends on this rename landing in the same PR (see `frontend.md`'s Step 7).

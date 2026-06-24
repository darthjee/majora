# Translator Plan: Add Character Hidden Description

Main plan: [plan.md](plan.md)

## Shared contracts

This agent **produces** the following new translation keys in both `en.yaml` and `pt.yaml`:

```yaml
character_full_page:
  loading: "Loading character..."          # en
  private_description_label: "DM Notes"   # en
```

```yaml
character_full_page:
  loading: "Carregando personagem..."      # pt
  private_description_label: "Notas do Mestre"  # pt
```

Additionally, new keys are needed in both language files for the edit-page private description field labels:

```yaml
npc_edit_page:
  private_description_label: "DM Notes"   # en
pc_edit_page:
  private_description_label: "DM Notes"   # en
```

```yaml
npc_edit_page:
  private_description_label: "Notas do Mestre"  # pt
pc_edit_page:
  private_description_label: "Notas do Mestre"  # pt
```

## Implementation Steps

### Step 1 — Add keys to en.yaml

In `frontend/assets/i18n/en.yaml`:
- Add a new top-level `character_full_page:` section with `loading` and `private_description_label`.
- Under the existing `npc_edit_page:` section, add `private_description_label: "DM Notes"`.
- Under the existing `pc_edit_page:` section, add `private_description_label: "DM Notes"`.

### Step 2 — Add keys to pt.yaml

In `frontend/assets/i18n/pt.yaml`, mirror all keys added in Step 1 with Portuguese translations:
- `character_full_page.loading`: `"Carregando personagem..."`
- `character_full_page.private_description_label`: `"Notas do Mestre"`
- `npc_edit_page.private_description_label`: `"Notas do Mestre"`
- `pc_edit_page.private_description_label`: `"Notas do Mestre"`

### Step 3 — Verify key parity

Run the key-parity check script (if one exists in the project) to confirm `en.yaml` and `pt.yaml` have identical key sets. If no automated check exists, manually diff the two files.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add new keys
- `frontend/assets/i18n/pt.yaml` — add new keys

## Notes

- The `character_full_page.loading` key reuses the same phrase as `character_page.loading`; it is a separate key so each page can be translated independently in the future.
- "DM Notes" is the label for the private description field. If the project's terminology differs (e.g. "Game Master Notes"), align with how "DM" or "Dungeon Master" is referred to elsewhere in the translation files.

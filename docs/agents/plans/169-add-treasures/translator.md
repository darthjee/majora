# Translator Plan: Add Treasures

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend page helpers already reference the following i18n keys. Both `en.yaml` and `pt.yaml` must define every key listed below; both files must stay in sync (the `check_i18n` CI step enforces parity).

| Key | English value (suggestion) |
|-----|---------------------------|
| `treasures_page.loading` | `Loading treasures...` |
| `treasures_page.new_treasure` | `New Treasure` |
| `treasure_page.loading` | `Loading treasure...` |
| `treasure_page.edit` | `Edit` |
| `treasure_new_page.title` | `New Treasure` |
| `treasure_new_page.name_label` | `Name` |
| `treasure_new_page.value_label` | `Value` |
| `treasure_new_page.submit` | `Create Treasure` |
| `treasure_new_page.error` | `Failed to create treasure. Please try again.` |
| `treasure_edit_page.title` | `Edit Treasure` |
| `treasure_edit_page.name_label` | `Name` |
| `treasure_edit_page.value_label` | `Value` |
| `treasure_edit_page.submit` | `Save changes` |
| `treasure_edit_page.error` | `Failed to save treasure. Please try again.` |

## Implementation Steps

### Step 1 — Add keys to `en.yaml`

Append the following block to `frontend/assets/i18n/en.yaml`:

```yaml
treasures_page:
  loading: Loading treasures...
  new_treasure: New Treasure
treasure_page:
  loading: Loading treasure...
  edit: Edit
treasure_new_page:
  title: New Treasure
  name_label: Name
  value_label: Value
  submit: Create Treasure
  error: Failed to create treasure. Please try again.
treasure_edit_page:
  title: Edit Treasure
  name_label: Name
  value_label: Value
  submit: Save changes
  error: Failed to save treasure. Please try again.
```

### Step 2 — Add keys to `pt.yaml`

Append the Portuguese equivalents to `frontend/assets/i18n/pt.yaml`:

```yaml
treasures_page:
  loading: Carregando tesouros...
  new_treasure: Novo Tesouro
treasure_page:
  loading: Carregando tesouro...
  edit: Editar
treasure_new_page:
  title: Novo Tesouro
  name_label: Nome
  value_label: Valor
  submit: Criar Tesouro
  error: Falha ao criar tesouro. Tente novamente.
treasure_edit_page:
  title: Editar Tesouro
  name_label: Nome
  value_label: Valor
  submit: Salvar alterações
  error: Falha ao salvar tesouro. Tente novamente.
```

### Step 3 — Verify parity

```
docker-compose run --rm majora_fe npm run check_i18n
```

## Files to Change

- `frontend/assets/i18n/en.yaml` — add 14 treasure i18n keys
- `frontend/assets/i18n/pt.yaml` — add 14 treasure i18n keys

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`)

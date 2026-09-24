# Translator Plan: Add a predefined category to GameTask

Main plan: [plan.md](plan.md)

## Shared contracts

Keys the frontend will call through `Translator.t()`:
- `game_task.category.<value>` for `printing`, `crafting`, `painting`, `planning`, `writing`,
  `research`, `scheduling`, `buying`, `updating`, `other`.
- `game_tasks_page.new_category_label`, `game_tasks_page.new_category_search_placeholder`.
- `game_task_edit_modal.category_label`, `game_task_edit_modal.category_search_placeholder`.
- `errors.<code>` for every DRF code the backend returns for `category` (`invalid_choice`,
  `null`, and possibly `blank`).

## Implementation Steps

### Step 1 — Add the category translations
New shared namespace `game_task`, placed in `common.yaml` because it is used by both the Tasks
page and the task detail modal (see `docs/agents/i18n.md`):
- Add a `game_task:` top-level key to `frontend/assets/i18n/en/common.yaml` and
  `frontend/assets/i18n/pt/common.yaml`.
- Add `'game_task'` to `commonNamespaces` in `frontend/assets/i18n/en/index.js` and
  `frontend/assets/i18n/pt/index.js`.

| `game_task.category.*` | en | pt |
|---|---|---|
| `printing` | Printing | Impressão |
| `crafting` | Crafting | Confecção |
| `painting` | Painting | Pintura |
| `planning` | Planning | Planejamento |
| `writing` | Writing | Escrita |
| `research` | Research | Pesquisa |
| `scheduling` | Scheduling | Agendamento |
| `buying` | Buying | Comprar |
| `updating` | Updating | Atualizar |
| `other` | Other | Outro |

### Step 2 — Picker labels and error codes
| key | en | pt |
|---|---|---|
| `game_tasks_page.new_category_label` | Category | Categoria |
| `game_tasks_page.new_category_search_placeholder` | Search category... | Buscar categoria... |
| `game_task_edit_modal.category_label` | Category | Categoria |
| `game_task_edit_modal.category_search_placeholder` | Search category... | Buscar categoria... |

- `errors.invalid_choice` already exists in both languages.
- Check `errors.null` and `errors.blank` in both `common.yaml` files; add any that are missing
  (e.g. en "This field may not be null." / "This field may not be blank.", pt "Este campo não
  pode ser nulo." / "Este campo não pode ficar em branco.").

## Files to Change
- `frontend/assets/i18n/en/common.yaml`, `frontend/assets/i18n/pt/common.yaml`: `game_task`
  namespace, and error entries if missing.
- `frontend/assets/i18n/en/index.js`, `frontend/assets/i18n/pt/index.js`: `commonNamespaces`.
- `frontend/assets/i18n/en/game_tasks_page.yaml`, `frontend/assets/i18n/pt/game_tasks_page.yaml`:
  picker label and placeholder.
- `frontend/assets/i18n/en/game_task_edit_modal.yaml`,
  `frontend/assets/i18n/pt/game_task_edit_modal.yaml`: picker label and placeholder.

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: Check translations)

## Notes
- The pt labels "Comprar" and "Atualizar" are verbs while the others are nouns. The user chose
  them on purpose; keep them as they are.

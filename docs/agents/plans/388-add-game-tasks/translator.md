# Translator Plan: Add Game Tasks

Main plan: [plan.md](plan.md)

## Shared contracts

- `frontend` will reference these keys via `Translator.t('game_tasks_page.<key>')` and
  `Translator.t('game_task_edit_modal.<key>')` (exact key names below) — both `en.yaml` and
  `pt.yaml` must define the same key set, or `check_i18n` fails the build.
- Follow the existing per-page namespace convention already used for
  `game_sessions_page`/`game_session_page`/`game_session_new_page`/`game_session_edit_page` in
  `frontend/assets/i18n/en.yaml`/`pt.yaml`.

## Implementation Steps

### Step 1 — Add `game_tasks_page` keys

Add to both `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml` (near the
`game_sessions_page`/`game_session_page` block), covering at least:

```yaml
game_tasks_page:
  loading: Loading tasks...
  title: Tasks
  empty: No tasks yet.
  new_short_description_label: Short description
  new_long_description_label: Long description
  add: Add task
  error: Unable to load tasks.
  view: View
```

(Portuguese equivalents in `pt.yaml`, matching the tone/casing of the existing
`game_sessions_page`/`game_session_new_page` entries, e.g. "Carregando tarefas...",
"Tarefas", "Nenhuma tarefa ainda.", "Descrição curta", "Descrição longa", "Adicionar tarefa",
"Não foi possível carregar as tarefas.", "Ver".)

### Step 2 — Add modal keys

Add a `game_task_edit_modal` namespace for the view/edit modal from `frontend.md`'s Step 5,
covering at least:

```yaml
game_task_edit_modal:
  title: Task
  edit: Edit
  save: Save
  cancel: Cancel
  short_description_label: Short description
  long_description_label: Long description
```

(Portuguese equivalents, e.g. "Tarefa", "Editar", "Salvar", "Cancelar", "Descrição curta",
"Descrição longa".)

### Step 3 — Verify key parity

Run the key-parity check locally before committing:

```bash
docker-compose run --rm majora_fe yarn check_i18n
```

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `game_tasks_page` and `game_task_edit_modal` keys
- `frontend/assets/i18n/pt.yaml` — add the same keys, translated

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)

## Notes

- Exact key names may need small adjustments once `frontend` finalizes the actual copy/labels
  used in the implemented page and modal — coordinate with whichever agent implements
  `frontend.md` if labels change, so both yaml files and the JSX stay in sync.

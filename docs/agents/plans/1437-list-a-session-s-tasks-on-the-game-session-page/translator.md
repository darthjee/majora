# Translator Plan: List a session's tasks on the game session page

Main plan: [plan.md](plan.md)

## Shared contracts

Add these keys under `game_session_page` in both languages:

| Key | en | pt |
|---|---|---|
| `tasks_title` | `Tasks` | `Tarefas` |
| `tasks_loading` | `Loading tasks...` | `Carregando tarefas...` |
| `tasks_empty` | `No tasks for this session.` | `Nenhuma tarefa para esta sessão.` |
| `tasks_error` | `Unable to load tasks.` | `Não foi possível carregar as tarefas.` |
| `tasks_see_all` | `See all ({{count}})` | `Ver todas ({{count}})` |

## Implementation Steps

### Step 1 — Add the session tasks keys
Append the keys above to `game_session_page` in the English and Portuguese files, keeping the existing keys and ordering. Quote `tasks_see_all` (it contains `{{count}}`), following the style of `collections_page.stl_model_count`.

## Files to Change
- `frontend/assets/i18n/en/game_session_page.yaml`: add the 5 keys.
- `frontend/assets/i18n/pt/game_session_page.yaml`: add the 5 keys.

## CI Checks
- `frontend/`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)

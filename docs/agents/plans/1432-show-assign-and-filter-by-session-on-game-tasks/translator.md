# Translator Plan: Show, assign and filter by session on game tasks

Main plan: [plan.md](plan.md)

## Shared contracts

Produces contract 5 of [plan.md](plan.md#shared-contracts). Add these keys to both `en` and `pt`:

- `game_tasks_page.new_session_label` — "Session" / "Sessão"
- `game_tasks_page.new_session_search_placeholder` — "Search sessions…" / "Buscar sessões…"
- `game_task_edit_modal.session_label` — "Session" / "Sessão"
- `game_task_edit_modal.session_search_placeholder` — "Search sessions…" / "Buscar sessões…"
- `game_task_edit_modal.no_session` — "No session" / "Sem sessão"
- `game_tasks_page.filter_session_label` — "Session" / "Sessão"
- `game_tasks_page.filter_session_none` — "No session" / "Sem sessão"
- `game_tasks_page.filter_session_specific` — "Specific session" / "Sessão específica"
- `game_tasks_page.filter_session_search_placeholder` — "Search sessions…" / "Buscar sessões…"
- `resource_picker.clear` — "Clear" / "Limpar"

## Implementation Steps

### Step 1 — Add the keys
Add the keys above to the `en` and `pt` translation files under `frontend/assets/i18n/`, following their existing file layout. Run the translation key sync check. If `resource_picker` doesn't exist as a namespace, use the namespace the other shared form components already use, and tell the frontend agent which key you chose.

## Files to Change
- `frontend/assets/i18n/en/...` — new keys.
- `frontend/assets/i18n/pt/...` — new keys.

## CI Checks
- `frontend`: the translation key sync check and `docker-compose run --rm majora_fe yarn lint`

# Translator Plan: Filter game tasks by category and completion on the Tasks page

Main plan: [plan.md](plan.md)

## Shared contracts

Produces every key in the i18n table in [plan.md](plan.md#i18n-keys-translator--frontend-in-both-en-and-pt),
in both `en` and `pt`, and removes the ten per-page `filter_query` / `filter_clear` keys
listed there. The frontend switches to the new keys in the same PR.

## Implementation Steps

### Step 1 — Shared `filter_actions` namespace

- Add a top-level `filter_actions:` block to `en/common.yaml` (`query: Query`,
  `clear: Clear`) and `pt/common.yaml` (`query: Filtrar`, `clear: Limpar`).
- Add `'filter_actions'` to `commonNamespaces` in `en/index.js` and `pt/index.js`.
- Remove `filter_query` / `filter_clear` from `game_npcs_page.yaml`, `game_polls_page.yaml`,
  `treasures_page.yaml`, `staff_users_page.yaml` and `stl_models_page.yaml`, in both languages.

### Step 2 — Tasks page filter keys

Add to `game_tasks_page.yaml` in both languages: `filter_category_label`,
`filter_completed_label`, `filter_completed_pending`, `filter_completed_done` and
`empty_filtered`, with the values from the shared table.

## Files to Change

- `frontend/assets/i18n/en/common.yaml`, `frontend/assets/i18n/pt/common.yaml` — `filter_actions`.
- `frontend/assets/i18n/en/index.js`, `frontend/assets/i18n/pt/index.js` — `commonNamespaces`.
- `frontend/assets/i18n/{en,pt}/game_npcs_page.yaml`, `game_polls_page.yaml`,
  `treasures_page.yaml`, `staff_users_page.yaml`, `stl_models_page.yaml` — remove the old keys.
- `frontend/assets/i18n/{en,pt}/game_tasks_page.yaml` — new filter keys.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI: `Check translations`).

## Notes

- Specs preload real translations (`specs/support/preloadTranslations.js`), so the frontend
  specs depend on these keys existing.

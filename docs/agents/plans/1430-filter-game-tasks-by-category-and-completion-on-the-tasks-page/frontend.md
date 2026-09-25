# Frontend Plan: Filter game tasks by category and completion on the Tasks page

Main plan: [plan.md](plan.md)

## Shared contracts

- **Relies on (backend):** `GET /games/:game_slug/tasks` accepts optional `category` and
  `completed` (`true`/`false`) query params, combined with AND; unknown values are ignored. See
  [plan.md](plan.md#api-get-gamesgame_slugtasks-backend--frontend).
- **Relies on (translator):** `filter_actions.query` / `filter_actions.clear` (common namespace)
  and `game_tasks_page.filter_category_label`, `filter_completed_label`,
  `filter_completed_pending`, `filter_completed_done`, `empty_filtered`. The per-page
  `filter_query` / `filter_clear` keys of the five existing filter bars are removed, so this PR
  must stop referencing them. See [plan.md](plan.md#i18n-keys-translator--frontend-in-both-en-and-pt).
- **Produces:** `FilterActions` (`components/common/forms/FilterActions.jsx`), props
  `{ onQuery, onClear, testIdPrefix }`, test ids `${testIdPrefix}-filter-query` /
  `${testIdPrefix}-filter-clear`.

## Steps

- [01 — Extract FilterActions](frontend/01-extract-filter-actions.md)
- [02 — Migrate the five existing filter bars](frontend/02-migrate-existing-filter-bars.md)
- [03 — Register the task filter keys in HashRouteResolver](frontend/03-register-filter-keys.md)
- [04 — Add the TaskFilters element](frontend/04-add-task-filters.md)
- [05 — Wire the filters into the Tasks page](frontend/05-wire-tasks-page.md)

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn test` (Jasmine, CI: frontend `Tests`).
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI: `Check JS Lint`).
- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI: `Check translations`).

## Notes

- The `FilterActions` migration is a pure refactor: same markup, classes and test ids on the five
  existing filter bars; their existing helper specs must pass unchanged.
- Specs preload real translations, so the translator's keys must be in place before running them.
- Out of scope: session filter (#1432), grouping by category, multi-category filtering.

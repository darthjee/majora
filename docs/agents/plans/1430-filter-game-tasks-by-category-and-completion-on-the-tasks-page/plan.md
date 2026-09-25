# Plan: Filter game tasks by category and completion on the Tasks page

Issue: [1430-filter-game-tasks-by-category-and-completion-on-the-tasks-page.md](../../issues/1430-filter-game-tasks-by-category-and-completion-on-the-tasks-page.md)

## Overview

The game tasks list endpoint gains optional `category` and `completed` query params, and the
Tasks page gains a `TaskFilters` bar (Category + Status selects, Query/Clear) that keeps the
filters in the URL hash, following the Polls filter pattern. The Query/Clear buttons duplicated in
five filter bars are extracted into a shared `FilterActions` component backed by a shared
`filter_actions` i18n namespace.

## Agents involved

- [backend](backend.md)
- [translator](translator.md)
- [frontend](frontend.md)

## Shared contracts

### API: `GET /games/:game_slug/tasks` (backend → frontend)

- New optional query params, combined with AND, applied before pagination:
  - `category`: one of `printing`, `crafting`, `painting`, `planning`, `writing`,
    `research`, `scheduling`, `buying`, `updating`, `other` (exact match,
    `Task.CATEGORY_CHOICES`). Any other value is ignored (no filter, still 200).
  - `completed`: `true` / `false`, case-insensitive. Any other value is ignored.
- Response shape, headers (pagination), permissions and `@restricted` gating are unchanged.
- Example: `GET /games/demo/tasks.json?category=painting&completed=false&page=1`.

### i18n keys (translator → frontend), in both `en` and `pt`

| key | en | pt |
|---|---|---|
| `filter_actions.query` (new common namespace) | Query | Filtrar |
| `filter_actions.clear` (new common namespace) | Clear | Limpar |
| `game_tasks_page.filter_category_label` | Category | Categoria |
| `game_tasks_page.filter_completed_label` | Status | Status |
| `game_tasks_page.filter_completed_pending` | Pending | Pendente |
| `game_tasks_page.filter_completed_done` | Completed | Concluída |
| `game_tasks_page.empty_filtered` | No tasks match the filters. | Nenhuma tarefa corresponde aos filtros. |

- `filter_actions` lives in `common.yaml` and is listed in `commonNamespaces` (both
  `index.js` files).
- Removed in both languages: `filter_query` / `filter_clear` from `game_npcs_page`,
  `game_polls_page`, `treasures_page`, `staff_users_page`, `stl_models_page`. The frontend must
  stop referencing them in the same PR (only the five `*FiltersHelper.jsx` files use them).

### `FilterActions` component (frontend-internal, used by six filter bars)

- `components/common/forms/FilterActions.jsx`, props `{ onQuery, onClear, testIdPrefix }`.
- Test ids `${testIdPrefix}-filter-query` / `${testIdPrefix}-filter-clear`. Existing prefixes:
  `npc`, `poll`, `treasure`, `staff-users`, `stl-model`; new: `task`.

# Issue: Filter game tasks by category and completion on the Tasks page

## Description
Follow-up to #1429, which added a predefined `category` to game tasks (`Task`). The game's Tasks
page (index) should let the DM filter the list by category and by completed/pending state. While
doing so, the Query/Clear buttons duplicated across the app's filter bars are extracted into a
shared component.

## Depends on
- #1429

## Problem
A DM's task list mixes every kind of prep work, and done and pending tasks are listed together.
Since #1429 each task shows its category, but there is no way to narrow the list to one category
or to what's still pending. The list is paginated on the server, so the DM can't even see all
tasks of one kind at once.

Separately, five filter bars (NPCs, Polls, Treasures, Staff Users, STL Models) each render their
own copy of the Query/Clear buttons and their own `filter_query`/`filter_clear` i18n keys.

## Expected Behavior
- The Tasks page shows a filter bar (between the title and the list) with a **Category** select,
  a **Status** (completed) select, and **Query**/**Clear** buttons.
- Query filters the list on the backend (both filters combined with AND), resets to page 1, and
  keeps the filters in the URL hash, so they survive reloads, deep links and page changes.
- Clear resets both selects and shows the full list again.
- With filters active and no match, the page says "No tasks match the filters." instead of
  "No tasks yet.".
- The other five filter bars look and behave exactly as before, now through a shared
  `FilterActions` component.

## Solution
### Backend
- `game_tasks_list` (GET): read optional `category` and `completed` query params and filter
  `game.tasks` by them before `paginated_list_response` (same shape as `status` in
  `game_polls_list._list_polls`, validation like `_filter_by_allegiance`/`_filter_by_slain`).
  `category` must be one of `Task.CATEGORY_CHOICES`; `completed` must be `true`/`false`
  (case-insensitive). Any other value is ignored (see Edge cases).

### Frontend: Tasks page
- New `TaskFilters` element (component + `TaskFiltersController` + `TaskFiltersHelper`, under
  `resources/game/pages/elements/`, mirroring `PollFilters`), built from `FilterSelect` and
  `FilterActions` (test id prefix `task`, select ids `task-filter-category` /
  `task-filter-completed`). Draft values are pre-populated from
  `HashRouteResolver.getFilterParams()`; the query is built with `buildFilterQuery` (blank
  fields omitted).
- Category options: `TASK_CATEGORY_VALUES` in order, labels via `translateTaskCategory`, after a
  leading blank option. Status options: blank, `false` (Pending), `true` (Completed).
- Add `category` and `completed` to `FILTER_KEYS` in `utils/routing/HashRouteResolver.js`, or
  `getFilterParams()` won't return them.
- `GameTasks.jsx`: compute `basePath`/`activeFilters`, add `handleFilterQuery` (sets the hash via
  `GameTasksController.buildFilterQueryHash` → `buildFilteredHref`, then re-runs the effect) and
  `handleFilterClear` (hash back to `basePath`), like `GamePolls.jsx`; pass the `filters`
  element and `activeFilters` to the helper.
- `GameTasksController.#fetchTasks`: merge the hash filter params into the request `query`, like
  `GamePollsController.#fetchPolls`.
- `GameTasksHelper.render`: render the filter bar between the title and the list; pass
  `extraParams={activeFilters}` to `Pagination` so page links keep the filters; show
  `empty_filtered` instead of `empty` when any filter is active.

### Frontend: shared `FilterActions` (extraction)
The Query/Clear buttons are currently duplicated in five filter helpers
(`NpcFiltersHelper`, `PollFiltersHelper`, `TreasureFiltersHelper`, `StaffUsersFiltersHelper`,
`StlModelFiltersHelper`), each with its own `filter_query`/`filter_clear` i18n keys. This issue
extracts them and migrates every existing caller:
- New `FilterActions` component in `components/common/forms/` (next to `FilterSelect`): renders
  the Query (`btn btn-primary`) and Clear (`btn btn-outline-secondary`) buttons, each in a
  `col-auto`. Props: `onQuery`, `onClear`, `testIdPrefix` — test ids stay
  `<prefix>-filter-query` / `<prefix>-filter-clear`, so existing specs' selectors keep working.
- New shared i18n namespace `filter_actions` in `en/common.yaml` and `pt/common.yaml`
  (`query`: Query / Filtrar, `clear`: Clear / Limpar), added to `commonNamespaces` in both
  `index.js` files.
- The five existing filter helpers switch to `FilterActions`; their per-page
  `filter_query`/`filter_clear` keys are removed from both languages.
- The new `TaskFilters` uses `FilterActions` (prefix `task`) and `FilterSelect`.
- Pure refactor for the existing pages: no visual or behavioral change.

### i18n (`en` / `pt`, key sets kept in sync)
| key | en | pt |
|---|---|---|
| `filter_actions.query` (common) | Query | Filtrar |
| `filter_actions.clear` (common) | Clear | Limpar |
| `game_tasks_page.filter_category_label` | Category | Categoria |
| `game_tasks_page.filter_completed_label` | Status | Status |
| `game_tasks_page.filter_completed_pending` | Pending | Pendente |
| `game_tasks_page.filter_completed_done` | Completed | Concluída |
| `game_tasks_page.empty_filtered` | No tasks match the filters. | Nenhuma tarefa corresponde aos filtros. |

Removed: `filter_query`/`filter_clear` from `game_npcs_page`, `game_polls_page`,
`treasures_page`, `staff_users_page` and `stl_models_page` in both languages.

### Scope
**In scope**
- Backend `category` and `completed` query params on the game tasks list endpoint.
- `TaskFilters` bar (Category + Completed selects, Query/Clear) on the Tasks page, with the
  filters in the URL hash.
- The `FilterActions` extraction and the migration of the five existing filter bars.
- i18n keys for the new filter labels/options in `en` and `pt`.

**Out of scope**
- Showing, assigning or filtering by a task's session: tracked in #1432 (sessions can't be seen or
  set on tasks in the UI yet, so a Session filter alone would make no sense).
- Grouping the task list by category: the badge from #1429 plus the filter covers the need, and
  grouping doesn't fit server-side pagination. No follow-up planned.
- Filtering by several categories at once.
- Navi changes: tasks are DM-private and not cache-warmed.

### Edge cases
#### API
- An unknown `category` (e.g. `cooking`, or a different case like `Painting`) or a `completed`
  value other than `true`/`false` (case-insensitive) is **ignored**: that param doesn't filter,
  and the request still returns 200. This follows the NPC filters (`_filter_by_allegiance`,
  `_filter_by_slain`) and the `?role=` param. No 400.
- No params: the list is unchanged (all tasks).
- `category` and `completed` combine with AND.

#### Frontend
- An unknown `category` in the URL hash leaves the Category select blank (it only lists
  `TASK_CATEGORY_VALUES`), matching the backend ignoring it.
- Empty list: with no active filter, keep `game_tasks_page.empty` ("No tasks yet."); with at
  least one active filter, show a new `game_tasks_page.empty_filtered` key ("No tasks match the
  filters." / "Nenhuma tarefa corresponde aos filtros.").
- Creating a task that doesn't match the active filters still appends it to the list shown (as
  today), so the DM sees it was created. It drops out on the next query or reload.
- Toggling `completed` (or changing the category in the detail modal) so a task no longer
  matches the active filters keeps it in the list with its new state, so a mis-click can be
  undone right away. It drops out on the next query or reload.

### Permissions
No change. The endpoint stays `@restricted` and gated by
`EndpointPermission(..., 'game_task', 'restricted', 'edit')` (DM-only); the filters only narrow a
list the DM can already read. `GameTasksController` keeps reading it through
`RequestStore.ensure`, with no direct `AccessStore` call.

### Backward compatibility
No breaking change:
- Without `category`/`completed`, the tasks endpoint behaves exactly as today.
- The `FilterActions` migration is a pure refactor: same markup, classes and test ids on the five
  existing filter bars.
- The removed per-page `filter_query`/`filter_clear` keys are only referenced by those five
  helpers (no specs or other code use them), and they move to the `filter_actions` namespace
  in `common.yaml`, which is loaded at startup. `en` and `pt` must stay in sync.

### Testing strategy
- **Backend**: view tests for the tasks list with `category` alone, `completed` alone (both
  values, case-insensitive), both combined, invalid values ignored, and no params.
- **Frontend** (Jasmine):
  - `FilterActions`: renders both buttons with the prefixed test ids and calls
    `onQuery`/`onClear`.
  - `TaskFilters` + controller/helper: draft values pre-populated from the hash, blank fields
    omitted from the built query, Clear resets both selects, unknown hash category leaves the
    select blank.
  - `GameTasksController`: forwards the hash filter params to the request and builds the
    filtered hash with pagination reset.
  - `GameTasksHelper`: `empty` vs `empty_filtered` message.
  - Existing specs of the five migrated filter bars pass unchanged.
- Translation key sync check passes for `en`/`pt`.

### Performance & security
- No index on `category`/`completed`: the query is already scoped to one game's tasks.
- Both params are checked against a fixed set of values before reaching `.filter()`; no raw
  user input goes into the ORM.

## Benefits
- DMs can focus on one kind of prep work, or on what's still pending, across the whole list
  instead of one page at a time.
- Filtered views are bookmarkable and survive reloads.
- One shared `FilterActions` component and one pair of i18n keys replace five copies.

# Add the TaskFilters element

Create the Tasks page filter bar, mirroring `PollFilters` (component + controller + helper):

- `TaskFilters({ onQuery, onClear })`: draft state `category` and `completed`, initialised from
  `new HashRouteResolver().getFilterParams()`. An initial `category` not in
  `TASK_CATEGORY_VALUES`, or a `completed` other than `'true'`/`'false'`, starts as `''`.
- `TaskFiltersController(setCategory, setCompleted)`: `handleCategoryChange`,
  `handleCompletedChange`, `buildQuery(category, completed)` →
  `buildFilterQuery([['category', category], ['completed', completed]])` (blank fields omitted),
  and `clear()` resetting both to `''`.
- `TaskFiltersHelper.render(state, handlers)`: a `row g-2 align-items-end mb-4` wrapper
  (`data-testid="task-filters"`) with:
  - `FilterSelect` id `task-filter-category`, label `game_tasks_page.filter_category_label`,
    options `TASK_CATEGORY_VALUES.map((value) => ({ value, label: translateTaskCategory(value) }))`
    (fixed order, `other` last).
  - `FilterSelect` id `task-filter-completed`, label `game_tasks_page.filter_completed_label`,
    options `false` → `filter_completed_pending`, `true` → `filter_completed_done`.
  - `FilterActions` with `testIdPrefix="task"`.

Specs (mirroring the `PollFilters*Spec.js` files): draft values read from the hash; unknown hash
values leave the selects blank; `buildQuery` omits blank fields; Query passes the built query to
`onQuery`; Clear resets both selects then calls `onClear`; the helper renders both selects with
their options in order and the two action buttons.

## Files to Change

- `frontend/assets/js/components/resources/game/pages/elements/TaskFilters.jsx` — new.
- `frontend/assets/js/components/resources/game/pages/elements/controllers/TaskFiltersController.js` — new.
- `frontend/assets/js/components/resources/game/pages/elements/helpers/TaskFiltersHelper.jsx` — new.
- `frontend/specs/assets/js/components/resources/game/pages/elements/TaskFiltersSpec.js` — new.
- `frontend/specs/assets/js/components/resources/game/pages/elements/controllers/TaskFiltersControllerSpec.js` — new.
- `frontend/specs/assets/js/components/resources/game/pages/elements/helpers/TaskFiltersHelperSpec.js` — new.

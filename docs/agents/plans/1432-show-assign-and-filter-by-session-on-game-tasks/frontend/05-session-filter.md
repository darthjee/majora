# Session filter in TaskFilters

Add a Session filter to the filter bar:

- `TaskFiltersHelper`: add a `FilterSelect` (`id="task-filter-session"`, label `game_tasks_page.filter_session_label`) with the options blank/**Any**, `none` (`filter_session_none`) and `specific` (`filter_session_specific`). When the mode is `specific`, render a `SingleResourcePickerField` (`id="task-filter-session-pick"`, `buildSessionPicker(gameSlug)`, placeholder `filter_session_search_placeholder`) next to it.
- `TaskFiltersController`:
  - Track draft `sessionMode` (`''` | `'none'` | `'specific'`) and `sessionPick` (`{id, name}` | `null`).
  - `initialFilters(params)` maps `session=none` → mode `none`, and `session=<digits>` → mode `specific` with a pending id. Anything else maps to blank.
  - `buildQuery(category, completed, sessionMode, sessionPick)` adds `session` as `'none'`, `String(sessionPick.id)`, or omits it. It also omits it when the mode is `specific` but nothing has been picked.
  - `clear()` resets both.
- `TaskFilters.jsx`: when the initial session is a specific id, fetch its title once with `RequestStore.ensure({ resource: 'session', quantityType: 'single', params: { gameSlug, id } })` to populate `sessionPick`. On failure, fall back to blank.
- `TaskFilters` needs `gameSlug`; pass it from `GameTasks.jsx`.
- Pagination links already preserve `activeFilters`, so `session` flows through `buildFilteredHref` and `HashRouteResolver.getFilterParams()` into the tasks fetch unchanged. Check that `getFilterParams` doesn't allow-list keys; if it does, add `session`.

Specs: initial filters from the hash (none, id, garbage), query building for each mode, clear, and the helper rendering the picker only in `specific` mode.

## Files to Change
- `frontend/assets/js/components/resources/game/pages/elements/TaskFilters.jsx`
- `frontend/assets/js/components/resources/game/pages/elements/controllers/TaskFiltersController.js`
- `frontend/assets/js/components/resources/game/pages/elements/helpers/TaskFiltersHelper.jsx`
- `frontend/assets/js/components/resources/game/pages/GameTasks.jsx` — pass `gameSlug` to `TaskFilters`.
- Corresponding specs.

# Wire the filters into the Tasks page

Connect `TaskFilters` to the page, following `GamePolls.jsx` / `GamePollsController`:

- `GameTasksController`:
  - New static `buildFilterQueryHash(basePath, filters)` → `buildFilteredHref(basePath, filters)`
    (resets to page 1).
  - `#fetchTasks`: send `query: { ...pagination params, ...Object.fromEntries(hashResolver.getFilterParams()) }`,
    like `GamePollsController.#fetchPolls`.
- `GameTasks.jsx`: compute `activeFilters = Object.fromEntries(new HashRouteResolver().getFilterParams())`;
  add `handleFilterQuery(filters)` (set `window.location.hash` to
  `GameTasksController.buildFilterQueryHash(basePath, filters)`, then `controller.buildEffect()()`)
  and `handleFilterClear()` (hash back to `basePath`, then re-run the effect); pass `activeFilters`
  and `filters: <TaskFilters onQuery={handleFilterQuery} onClear={handleFilterClear} />` in the
  helper state.
- `GameTasksHelper.render`: render `filters` between the `<h1>` and the list; pass
  `extraParams={activeFilters}` to `Pagination` so page links keep the filters; `#renderList`
  shows `game_tasks_page.empty_filtered` instead of `empty` when `activeFilters` has any key.
  Update the JSDoc for the new `state.activeFilters` / `state.filters`.
- Unchanged on purpose (see issue Edge cases): creating a task still appends it to the list shown
  even if it doesn't match the filters, and toggling `completed` / editing the category keeps the
  task in the list until the next query or reload.

Specs:

- `GameTasksController/buildEffectSpec.js`: the request query includes `category`/`completed`
  from the hash alongside pagination.
- New `GameTasksController/buildFilterQueryHashSpec.js`: `page=1` plus the filters.
- `GameTasksHelperSpec.js`: filter bar rendered before the list; `Pagination` gets
  `extraParams`; `empty` vs `empty_filtered`.
- `GameTasksSpec.js`: Query sets the filtered hash and refetches; Clear resets the hash.

## Files to Change

- `frontend/assets/js/components/resources/game/pages/controllers/GameTasksController.js`
- `frontend/assets/js/components/resources/game/pages/GameTasks.jsx`
- `frontend/assets/js/components/resources/game/pages/helpers/GameTasksHelper.jsx`
- `frontend/specs/assets/js/components/resources/game/pages/controllers/GameTasksController/buildEffectSpec.js`
- `frontend/specs/assets/js/components/resources/game/pages/controllers/GameTasksController/buildFilterQueryHashSpec.js` — new.
- `frontend/specs/assets/js/components/resources/game/pages/helpers/GameTasksHelperSpec.js`
- `frontend/specs/assets/js/components/resources/game/pages/GameTasksSpec.js`

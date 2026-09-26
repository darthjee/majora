# Issue: Show, assign and filter by session on game tasks

## Description
Follow-up to #1430. Game tasks (`Task`) have an optional `session` foreign key to `GameSession` (`on_delete=SET_NULL`). The API already accepts it on create/update (`GameTaskCreateSerializer` / `GameTaskUpdateSerializer`, both checking via `validate_session` that the session belongs to the same game) and returns it as a bare id in `GameTaskListSerializer`. The frontend never shows or sets it: the Tasks page create form, the task list and the task detail modal all ignore it.

## Problem
- A DM cannot see which session a task belongs to.
- A DM cannot link a task to a session, or unlink it, from the UI.
- The Tasks page filter bar (`TaskFilters`, from #1430) cannot narrow tasks by session, so per-session prep ("what do I need to do for next session?") is not possible.
- The list endpoint only returns the session id, so the frontend has no title to display.
- There is no searchable list of a game's sessions to pick from: only the `future`, `past` and `unscheduled` session endpoints exist.

## Expected Behavior
- The Tasks page list and the task detail modal show the task's session title, or nothing when it is unset.
- The create and edit task forms have a **Session** field where the DM can search the game's sessions by title (the first 5 matches are shown), pick one, or clear the field.
- The `TaskFilters` bar has a **Session** filter that combines with the Category and Completed filters and is kept in the URL hash like the others. Its options are **Any** (the default, no filtering), **No session**, and a specific session chosen by searching the same way (first 5 matches).
- Sorting and grouping of the task list stay as they are; this issue only adds the filter.

## Solution
### Backend
- `GameTaskListSerializer`: return the session as a nested object, `session: {id, title}` (or `null`). Create and update keep accepting `session` as an id (or `null`); their responses already use `GameTaskListSerializer`, so they return the nested form too.
- `game_tasks_list` (`_list_tasks`): add a `_filter_by_session` step that reads the `session` query param. A numeric id narrows to that session, `none` narrows to `session__isnull=True`, and any other value is ignored, the same way the `category` and `completed` filters behave.
- A searchable, paginated list of the game's sessions for the picker: filter by title with the param the picker sends (`ResourcePickerSearch` sends `name` and `per_page`), limited to 5 results. The endpoint must be gated the same way as the Tasks page (DM-only), or rely on the existing session visibility rules.
- Tests for the nested serializer field, the `session` filter (id, `none`, invalid value) and the session search.

### Frontend
- Show the session title in the Tasks page list rows and in `TaskDetailModal`, reading `task.session.title`.
- Add a Session field to the task create and edit forms using `SingleResourcePickerField` in resource/API mode against the session search, with `maxEntries` = 5 and a way to clear the value. Submit the session id, not the nested object.
- Add a Session filter to `TaskFilters` / `TaskFiltersController` with the options **Any**, **No session** (`session=none`) and a searched session (`session=<id>`, first 5 matches). Keep it in the URL hash and send it as the `session` query param.
- Update every consumer of `task.session` for the nested shape.
- Translations for the new labels in every language under `frontend/assets/i18n/`.

### Cache
- Tasks are `@restricted`, so Navi should not need warming changes; the cache agent should confirm this, including for the session search endpoint.

### Out of scope
- Listing a session's tasks on the game session page is tracked in #1437.

## Benefits
- DMs can organize their prep per session directly from the Tasks page.
- The UI finally uses session data the backend already stores and validates.

# Add the SessionTasksWidget

Add a self-fetching, DM-only widget following the `OpenPollsWidget` pattern (component, controller and helper):

- **`SessionTasksWidget({session})`** (`game_session/pages/elements/SessionTasksWidget.jsx`):
  - `visible = Boolean(session?.can_edit)`. When it is not visible, skip the effect (no request) and return `null`.
  - State: `tasks`, `total`, `loading`, `error`, `selectedTask`.
  - The effect runs `controller.buildEffect(session.game_slug, session.id)()`. Its deps are `[controller, visible, session?.game_slug, session?.id]`.
  - Renders the helper output plus `<TaskDetailModal show task gameSlug onClose onSave />`, using `saveTaskEdit` for `onSave` the same way `buildSaveEditHandler` does: on success, replace `selectedTask` when it is still selected.
  - If the saved task's `session?.id` no longer equals `session.id` (the DM unassigned or moved it in the modal), remove it from `tasks` and decrement `total`.
- **`SessionTasksWidgetController`** (`game_session/pages/elements/controllers/SessionTasksWidgetController.js`):
  - `buildEffect(gameSlug, sessionId)` calls `RequestStore.ensure({componentName: 'SessionTasksWidgetController', resource: 'task', quantityType: 'collection', params: {gameSlug}, query: {session: String(sessionId), per_page: '5'}})`.
  - It sets `tasks` (array-guarded) and `total` (`pagination.total`) with mounted-guarded setters, sets `error` to `game_session_page.tasks_error` on failure, and always clears `loading`.
  - `handleToggle(gameSlug, task, tasks, setTasks)` delegates to `toggleTaskCompleted('SessionTasksWidgetController', …)`.
- **`SessionTasksWidgetHelper.render({tasks, total, loading, error, gameSlug, sessionId}, {onToggle, onView})`** (`game_session/pages/elements/helpers/SessionTasksWidgetHelper.jsx`):
  - Renders a `<section data-testid="session-tasks">` with an `<h2>` titled `game_session_page.tasks_title`.
  - Then shows one of: loading text (`tasks_loading`), an error (`tasks_error`), the empty message (`tasks_empty`), or a `list-group` of `TaskListItem` (`showSession={false}`, `idPrefix="session-task"`).
  - When `total > tasks.length`, it adds a `tasks_see_all` link (`{count: total}`) to `GameTasksController.buildFilterQueryHash('#/games/<slug>/tasks', {session: String(sessionId)})`, i.e. `#/games/<slug>/tasks?page=1&session=<id>`, which `TaskFilters` already reads.

## Files to Change
- `frontend/assets/js/components/resources/game_session/pages/elements/SessionTasksWidget.jsx`: new.
- `frontend/assets/js/components/resources/game_session/pages/elements/controllers/SessionTasksWidgetController.js`: new.
- `frontend/assets/js/components/resources/game_session/pages/elements/helpers/SessionTasksWidgetHelper.jsx`: new.
- `frontend/specs/assets/js/components/resources/game_session/pages/elements/SessionTasksWidgetSpec.js`: new spec.
  - Hidden with no request when `can_edit` is false or missing.
  - Fetches with `session` and `per_page=5` when visible.
  - Opens the modal on View.
  - Drops a task whose session changed after a save.
- `frontend/specs/assets/js/components/resources/game_session/pages/elements/controllers/SessionTasksWidgetControllerSpec.js`: new spec covering the query, the success and failure setters, the unmounted guard, and toggle delegation.
- `frontend/specs/assets/js/components/resources/game_session/pages/elements/helpers/SessionTasksWidgetHelperSpec.js`: new spec covering the loading, error, empty and list states, and See all shown only when `total > tasks.length` with the correct href.

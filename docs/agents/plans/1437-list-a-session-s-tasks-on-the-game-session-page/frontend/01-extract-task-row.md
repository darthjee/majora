# Extract a shared task row

`GameTasksHelper#renderTaskItem` / `#renderTaskSession` (`frontend/assets/js/components/resources/game/pages/helpers/GameTasksHelper.jsx`) are private, so the session page cannot reuse them. Move the row into a component, `TaskListItem({task, onToggle, onView, showSession = true})`, that renders the same markup: the checkbox with `id="game-task-<id>"`, the label with `short_description`, the category `Badge`, the optional session title, and the **View** button (`game_tasks_page.view`).

- `showSession` lets the session page hide the session title, which would be redundant there.
- Use the task-id-based checkbox id as today. If both lists could ever render on one page, accept an optional `idPrefix` (default `game-task`) so ids stay unique. The session widget uses `session-task`.
- `GameTasksHelper#renderList` renders `<TaskListItem … />` for each task. The Tasks page's behavior and existing specs (`GameTasksHelperSpec.js`, `GameTasksHelperSessionSpec.js`) must stay green, adjusted only where they reached into moved internals.

## Files to Change
- `frontend/assets/js/components/resources/game/pages/elements/TaskListItem.jsx`: new shared row component.
- `frontend/assets/js/components/resources/game/pages/helpers/GameTasksHelper.jsx`: use `TaskListItem` and drop the moved private methods.
- `frontend/specs/assets/js/components/resources/game/pages/elements/TaskListItemSpec.js`: new spec covering the checkbox state and `onToggle`, `onView`, the category badge, and the session title shown or hidden (`showSession`, null session).

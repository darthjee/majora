# Refresh selectedTask in GameTasks after a successful save

Make the page replace the modal's task with the updated one after a successful save, and return
the result so the modal (step 02) can decide whether to leave edit mode.

**`GameTasks.jsx`**

- Export a named builder, following `buildTaskFilterHandlers`, e.g.
  `buildSaveEditHandler(controller, gameSlug, tasks, setTasks, setSelectedTask)`. It returns
  `async (task, values) => { ... }`, which:
  1. `const updated = await controller.handleSaveEdit(gameSlug, task, values, tasks, setTasks)`;
  2. if `updated`, `setSelectedTask((current) => (current && current.id === updated.id ? updated : current))`,
     so a modal closed mid-save is not reopened;
  3. `return updated` (the updated task or `null`).
- Replace the inline `handleSaveEdit` with this builder. The modal's
  `onSave={(values) => handleSaveEdit(selectedTask, values)}` now returns that promise to the modal.

**Specs**

- `GameTasksSpec.js`: add a `describe('buildSaveEditHandler')` block with a fake controller whose
  `handleSaveEdit` is a spy:
  - resolves to an updated task → `setSelectedTask` is called with an updater that maps the
    selected task (same id) to the updated one and leaves a different/null selection alone. The
    handler resolves to the updated task.
  - resolves to `null` → `setSelectedTask` is not called, and the handler resolves to `null`.
  - forwards `gameSlug`, `task`, `values`, `tasks` and `setTasks` to `controller.handleSaveEdit`.

## Files to Change

- `frontend/assets/js/components/resources/game/pages/GameTasks.jsx` — exported
  `buildSaveEditHandler`, used for the modal's `onSave`.
- `frontend/specs/assets/js/components/resources/game/pages/GameTasksSpec.js` — specs for the
  builder.

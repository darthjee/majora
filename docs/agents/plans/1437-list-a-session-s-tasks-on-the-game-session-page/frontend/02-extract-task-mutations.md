# Extract the task toggle/save mutations

`GameTasksController#handleToggleCompleted` and `#handleSaveEdit` do not use any controller state, but they live on the Tasks page controller, whose constructor and `buildEffect` are tied to the Tasks page hash. Extract them into a small module so the session widget can reuse them without duplicating the request logic:

- `frontend/assets/js/components/resources/game/pages/taskMutations.js` exports:
  - `toggleTaskCompleted(componentName, gameSlug, task, tasks, setTasks)`: an optimistic toggle with rollback, identical to today's behavior.
  - `saveTaskEdit(componentName, gameSlug, task, formValues, tasks, setTasks)`: resolves to the updated task or `null`, identical to today.
- `GameTasksController.handleToggleCompleted` / `handleSaveEdit` keep their signatures and delegate to these functions (passing `'GameTasksController'`), so `GameTasks.jsx`, `buildSaveEditHandler` and their specs are unaffected.

## Files to Change
- `frontend/assets/js/components/resources/game/pages/taskMutations.js`: new module.
- `frontend/assets/js/components/resources/game/pages/controllers/GameTasksController.js`: delegate to `taskMutations.js`.
- `frontend/specs/assets/js/components/resources/game/pages/taskMutationsSpec.js`: new spec. Move the request-level assertions from the controller spec here if that is cleaner, and keep a delegation check in the controller spec.

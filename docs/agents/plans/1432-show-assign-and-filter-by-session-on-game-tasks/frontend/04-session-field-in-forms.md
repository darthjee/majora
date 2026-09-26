# Session field in create and edit forms

**Create form** (`GameTasksHelper#renderAddForm`):
- Add a `SingleResourcePickerField` (`id="game-tasks-new-session"`, `picker={buildSessionPicker(gameSlug)}`, labels `game_tasks_page.new_session_label` / `new_session_search_placeholder`, `errors={fieldErrors.session ?? []}`).
- `onChange` stores the picked `{id, name}` in `formValues.session`; `onClear` sets it back to `null`.
- The page must pass `gameSlug` into the helper state.
- `GameTasksController#handleCreateTask` sends `session: formValues.session?.id ?? null`. The form reset clears it.

**Edit form** (`TaskDetailModal` + `TaskDetailModalHelper#renderEditForm`):
- Add a `session` edit state, initialized from `toTaskSessionPick(task.session)` on edit and reset on cancel.
- Add a `SingleResourcePickerField` (`id="task-detail-session"`) with `onSessionChange` and `onSessionClear` handlers.
- `GameTasksController#handleSaveEdit` sends `session: formValues.session?.id ?? null`.
- The modal needs `gameSlug`; pass it from `GameTasks.jsx`.
- After saving, the modal shows the response task, which already has the nested session. This must keep working with the #1435 fix.

Update the JSDoc for `formValues` in both controller methods. Specs: picker renders, clear works, and the payload includes `session`, both as an id and as `null`.

## Files to Change
- `frontend/assets/js/components/resources/game/pages/GameTasks.jsx` — form state `session`, pass `gameSlug`.
- `frontend/assets/js/components/resources/game/pages/helpers/GameTasksHelper.jsx` — create-form field.
- `frontend/assets/js/components/resources/game/pages/controllers/GameTasksController.js` — `session` in create and update bodies.
- `frontend/assets/js/components/common/modals/TaskDetailModal.jsx` — session edit state and handlers.
- `frontend/assets/js/components/common/modals/helpers/TaskDetailModalHelper.jsx` — edit-form field.
- Corresponding specs.

# Issue: Task detail modal is not updated after saving an edit on the game Tasks page

## Description
On the game Tasks page (`#/games/:game_slug/tasks`), the DM opens a task's detail modal, clicks
**Edit**, changes the category and/or the descriptions, and clicks **Save**. The modal returns to
view mode but still shows the **old** category and long description, while the task row in the
list is updated. Only closing and reopening the modal shows the new values.

## Problem
### Steps to reproduce
1. As the game's DM, go to `#/games/<slug>/tasks`.
2. Open a task (view modal).
3. Click **Edit**, change the category and the long description, then click **Save**.
4. The modal's view mode still shows the previous category badge and long description.

Also, if the save request fails, the modal still leaves edit mode and shows the old values with no
error message, so the user's edits are silently lost.

### Root cause
- `GameTasks.jsx` stores the opened task in `selectedTask` and passes it to `TaskDetailModal` as
  `task`. `handleSaveEdit` calls `GameTasksController#handleSaveEdit`, which only updates the
  `tasks` list (`setTasks(#replaceTask(...))`) and returns the updated task (or `null`). That
  return value is ignored, so `selectedTask` keeps the pre-edit object.
- `TaskDetailModalHelper#renderView` reads `state.task.category` / `state.task.long_description`,
  i.e. the stale prop.
- `TaskDetailModal#handleSave` calls `onSave(...)` and immediately runs `setEditing(false)`
  without awaiting the result, so failures are never detected.

## Expected Behavior
- After a successful save, the modal's view mode shows the saved task (category, long
  description), matching the list.
- When the save fails (non-2xx response or network error), the modal stays in edit mode, keeps
  the values the user typed, and shows an error message; the user can retry or cancel.
- While the save request is in flight, the **Save** and **Cancel** buttons are disabled and the
  Save button reads "Saving…", preventing double submits and cancel races.

## Solution
### Frontend
- `frontend/assets/js/components/resources/game/pages/GameTasks.jsx`: `handleSaveEdit` awaits
  `controller.handleSaveEdit(...)`; on a non-null result it calls `setSelectedTask(updated)`. It
  returns the result (updated task or `null`) so the modal can react to it. The modal's
  `useEffect([show, task])` then re-syncs its form values from the new task.
- `frontend/assets/js/components/common/modals/TaskDetailModal.jsx`: make `handleSave` async;
  await `onSave(...)`; leave edit mode only when the result is truthy. Otherwise stay in edit mode,
  keep the typed values, and set an `error` state. Clear the error on Edit, Cancel, and when
  another task is opened. Track a `saving` state: set it before awaiting `onSave(...)` and clear
  it when the request settles (success or failure).
- `frontend/assets/js/components/common/modals/helpers/TaskDetailModalHelper.jsx`: render the error
  (Bootstrap `alert alert-danger`) in the edit form when `state.error` is set. When `state.saving`
  is true, disable the Save and Cancel buttons and render the Save label as
  `game_task_edit_modal.saving`.
- i18n: add `game_task_edit_modal.save_error` (e.g. "Unable to save task.") and
  `game_task_edit_modal.saving` (e.g. "Saving…") to
  `frontend/assets/i18n/en/game_task_edit_modal.yaml` and `frontend/assets/i18n/pt/game_task_edit_modal.yaml`.
- `GameTasksController#handleSaveEdit` stays as is — it already returns the updated task or `null`.

### Tests (Jasmine)
- `frontend/specs/assets/js/components/resources/game/pages/GameTasksSpec.js`: after a successful
  save, the modal renders the updated category/long description; after a failed save, it still
  shows the original task.
- `frontend/specs/assets/js/components/common/modals/TaskDetailModalSpec.js`: when `onSave`
  resolves to a task, the modal leaves edit mode; when it resolves to `null`, it stays in edit
  mode, keeps the typed values and shows the error; Cancel clears the error; while `onSave` is
  pending, Save/Cancel are disabled and Save reads "Saving…".
- `frontend/specs/assets/js/components/common/modals/helpers/TaskDetailModalHelperSpec.js`: renders
  the error only when `state.error` is set, and disabled Save/Cancel with the saving label only
  when `state.saving` is set.

### Acceptance criteria
- [ ] After saving, the task modal shows the updated category and long description without being
      reopened.
- [ ] A failed save keeps the modal in edit mode with the user's values and shows an error.
- [ ] Save/Cancel are disabled and Save reads "Saving…" while the request is in flight.
- [ ] en/pt translations stay in sync; lint and the frontend specs pass.

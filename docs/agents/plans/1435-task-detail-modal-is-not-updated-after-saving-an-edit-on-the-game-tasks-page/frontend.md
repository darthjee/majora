# Frontend Plan: Task detail modal is not updated after saving an edit on the game Tasks page


Main plan: [plan.md](plan.md)

## Overview

Make the task detail modal on `#/games/:game_slug/tasks` show the saved task after an edit. It
must also handle a failed save (stay in edit mode, keep typed values, show an error) and show a
saving state that disables Save/Cancel.

## Context

- `GameTasks.jsx` keeps the opened task in `selectedTask`. `handleSaveEdit` calls
  `GameTasksController#handleSaveEdit`, which updates only the `tasks` list and returns the updated
  task (or `null` on failure). The page ignores that return value, so the modal keeps the pre-edit
  object.
- `TaskDetailModalHelper#renderView` renders `state.task.category` / `state.task.long_description`
  from that stale prop.
- `TaskDetailModal#handleSave` fires `onSave(...)` and runs `setEditing(false)` right away, without
  awaiting, so failures are never detected.
- Specs render with `renderToStaticMarkup` and capture the helper's `state`/`handlers`. State
  changes after an async call can't be observed that way. Follow the existing pattern
  (`buildTaskEditValues`, `buildTaskFilterHandlers`, `resetTaskFormValues`): put the new logic in
  exported, named plain functions and unit-test those directly.

## Steps


- [01 — Add save_error and saving translations](frontend/01-add-translations.md)
- [02 — Await the save in TaskDetailModal and render saving/error state](frontend/02-modal-async-save.md)
- [03 — Refresh selectedTask in GameTasks after a successful save](frontend/03-refresh-selected-task.md)

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`, "Check JS Lint")
- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`, "Check translations")
- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)

## Notes

- No backend change: `PATCH` on the task endpoint already returns the updated task, and
  `GameTasksController#handleSaveEdit` already returns it (or `null`). Keep it unchanged.
- The modal's `useEffect([show, task])` re-runs when `selectedTask` changes. It resets `editing` to
  false and re-syncs the form values from the new task. That is the desired behavior on success.
  The effect should also clear `error` and `saving`.
- If the modal is closed (`onClose`) while a save is still pending, the page must not reopen it:
  only call `setSelectedTask(updated)` when the saved task is still the selected one (compare by
  `id` with a functional setter).

# Show the session in the list and detail modal

- `GameTasksHelper#renderTaskItem`: when `task.session` is set, render its title after the category badge, as a second `Badge` or small muted text. Render nothing when it is `null`.
- `TaskDetailModalHelper#renderView`: show the session title under the category badge, or the `game_task_edit_modal.no_session` label when it is unset.

Specs cover both states in both places.

## Files to Change
- `frontend/assets/js/components/resources/game/pages/helpers/GameTasksHelper.jsx`
- `frontend/assets/js/components/common/modals/helpers/TaskDetailModalHelper.jsx`
- Corresponding specs.

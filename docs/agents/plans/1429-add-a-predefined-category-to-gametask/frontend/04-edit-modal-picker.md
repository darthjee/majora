# Category picker in the edit modal

1. **Modal state:** in `TaskDetailModal.jsx`, add
   `const [category, setCategory] = useState(task?.category ?? DEFAULT_TASK_CATEGORY)`. Reset it
   in the `useEffect` on `[show, task]` and in `handleCancel`, like the descriptions, so opening
   another task shows that task's category and cancelling discards the change.
   `handleSave` calls `onSave({ category, shortDescription, longDescription })`. Pass `category`
   in the render state and `onCategoryChange: (item) => setCategory(item.id)` in the handlers.
   Update the JSDoc for `onSave`.
2. **Picker:** in `TaskDetailModalHelper.#renderEditForm`, render a `SingleResourcePickerField`
   **before** the short-description input, with the same `picker` config as the create form,
   `value={toTaskCategoryPick(state.category)}`, `onChange={handlers.onCategoryChange}`,
   `label` / `searchPlaceholder` from `game_task_edit_modal.category_label` /
   `game_task_edit_modal.category_search_placeholder`, and id `task-detail-category`.
   The picker's own `searching` state resets on each open, because the edit form unmounts when
   `editing` is false.
3. **Request body:** `GameTasksController.handleSaveEdit` adds `category: formValues.category`
   to the PATCH body; update its JSDoc. `handleToggleCompleted` stays `{completed}` only.

Specs:
- A `TaskDetailModalHelper` spec: the edit form's first field is the category picker, showing
  the task's category; changing it calls `onCategoryChange`.
- A `TaskDetailModal` spec: cancel restores the original category; reopening with another task
  shows that task's category; save passes `category`.
- `handleSaveEditSpec.js`: the PATCH body includes `category`.
- `handleToggleCompletedSpec.js`: the body is still exactly `{completed}`.

## Files to Change
- `frontend/assets/js/components/common/modals/TaskDetailModal.jsx`: category state, reset,
  save.
- `frontend/assets/js/components/common/modals/helpers/TaskDetailModalHelper.jsx`: picker in the
  edit form.
- `frontend/assets/js/components/resources/game/pages/controllers/GameTasksController.js`:
  `category` in the PATCH body.
- `frontend/specs/assets/js/components/common/modals/...` modal and helper specs,
  `.../controllers/GameTasksController/handleSaveEditSpec.js`,
  `.../controllers/GameTasksController/handleToggleCompletedSpec.js`.

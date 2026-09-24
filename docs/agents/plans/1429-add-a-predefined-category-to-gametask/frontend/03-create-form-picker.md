# Category picker in the create form

1. **Form state:** in `GameTasks.jsx`, `EMPTY_FORM` becomes
   `{ category: DEFAULT_TASK_CATEGORY, shortDescription: '', longDescription: '' }`.
   `resetForm` must **keep the current category** and reset only the other fields:
   `setFormValues((prev) => ({ ...EMPTY_FORM, category: prev.category }))`. The form starts at
   `other` on mount, so a reload or another game's page starts at `other` again.
2. **Picker:** in `GameTasksHelper.#renderAddForm`, render a `SingleResourcePickerField`
   **before** the short-description `FormField`, with:
   - `picker={{ values: TASK_CATEGORY_VALUES, translateOption: translateTaskCategory }}`
   - `value={toTaskCategoryPick(formValues.category)}`
   - `onChange={(item) => handlers.onFormChange({ ...formValues, category: item.id })}`
   - `label` / `searchPlaceholder` from `game_tasks_page.new_category_label` /
     `game_tasks_page.new_category_search_placeholder`
   - `errors={fieldErrors.category ?? []}`
   - an id / test id of `game-tasks-new-category`
3. **Request body:** `GameTasksController.handleCreateTask` adds `category: formValues.category`
   to the POST body; update its JSDoc for `formValues`.
4. **Failed create:** keep the current behavior, where `resetForm` only runs on success, so
   every field, category included, keeps its value and the errors show.

Specs:
- `GameTasksHelperSpec.js`: the picker is the first field of the add form and starts at `other`;
  picking a value calls `onFormChange` with the new `category`; `fieldErrors.category` is shown.
- `handleCreateTaskSpec.js`: the POST body includes `category`; on success `resetForm` is called;
  on a 400 the form isn't reset.
- `GameTasksSpec.js`: after a successful create, the category keeps the last value while the
  descriptions reset.

## Files to Change
- `frontend/assets/js/components/resources/game/pages/GameTasks.jsx`: `EMPTY_FORM`, `resetForm`.
- `frontend/assets/js/components/resources/game/pages/helpers/GameTasksHelper.jsx`: picker in
  the add form.
- `frontend/assets/js/components/resources/game/pages/controllers/GameTasksController.js`:
  `category` in the POST body.
- `frontend/specs/assets/js/components/resources/game/pages/helpers/GameTasksHelperSpec.js`,
  `.../controllers/GameTasksController/handleCreateTaskSpec.js`,
  `.../pages/GameTasksSpec.js`.

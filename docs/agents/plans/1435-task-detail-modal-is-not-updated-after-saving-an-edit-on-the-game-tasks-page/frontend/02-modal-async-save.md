# Await the save in TaskDetailModal and render saving/error state

Change the modal's save flow so it reacts to the save result, and add the UI states.

**`TaskDetailModal.jsx`**

- Add `saving` (bool, default `false`) and `error` (string, default `''`) state.
- Export a named, plain async function that holds the save logic, so it can be unit-tested, e.g.
  `submitTaskEdit(onSave, values, { setSaving, setEditing, setError })`:
  1. `setError('')`, `setSaving(true)`;
  2. `const result = await onSave(values)`;
  3. `setSaving(false)`. If `result` is truthy, `setEditing(false)`. Otherwise, stay in edit mode
     and `setError(Translator.t('game_task_edit_modal.save_error'))`. Keep the typed values.
  4. Treat a rejected `onSave` like a `null` result (try/finally or catch), so `saving` is always
     cleared.
- `handleSave` delegates to that function with `{ category, shortDescription, longDescription }`.
- Clear `error` in `handleEdit`, in `handleCancel`, and in the `useEffect([show, task])` reset.
  The effect also sets `saving` to `false`.
- Pass `saving` and `error` in the `state` object given to `TaskDetailModalHelper.render`, and
  update the JSDoc.

**`TaskDetailModalHelper.jsx`**

- `#renderEditForm`: when `state.error` is set, render
  `<div className="alert alert-danger">{state.error}</div>` above the fields. Same markup as
  `PhotoUploadModalHelper`.
- `#renderEditActions(state, handlers)`: when `state.saving` is true, add `disabled` to both the
  Cancel and Save buttons, and render the Save label as `Translator.t('game_task_edit_modal.saving')`
  instead of `save`.
- Update the `render` JSDoc for `state.saving` / `state.error`.

**Specs**

- `TaskDetailModalSpec.js`: add tests for the exported save function:
  - `onSave` resolves to a task → `setEditing(false)`, `setSaving` goes true then false, and no error.
  - `onSave` resolves to `null` → `setEditing` is not called, and `setError` gets the save_error
    text.
  - `onSave` rejects → same as `null`, and `saving` is cleared.
  - `onSave` is called with the current values.
  Also check that the initial state has `saving: false` and `error: ''`. Update the existing
  "calls onSave with…" test if needed, because `onSave` is now awaited: use a spy that
  returns a promise.
- `TaskDetailModalHelperSpec.js`:
  - the alert renders only when `state.error` is set;
  - Save/Cancel are disabled and Save reads "Saving…" only when `state.saving` is true.

## Files to Change

- `frontend/assets/js/components/common/modals/TaskDetailModal.jsx` — async save, `saving`/`error`
  state, exported save helper.
- `frontend/assets/js/components/common/modals/helpers/TaskDetailModalHelper.jsx` — error alert,
  disabled buttons, saving label.
- `frontend/specs/assets/js/components/common/modals/TaskDetailModalSpec.js` — new/updated specs.
- `frontend/specs/assets/js/components/common/modals/helpers/TaskDetailModalHelperSpec.js` — new
  specs.

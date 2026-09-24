# Task category constant and badge display

Add the shared frontend pieces and show the category wherever a task is displayed.

1. **Constant and helpers:** a small module, e.g.
   `frontend/assets/js/components/resources/game/pages/taskCategories.js`, exporting:
   - `TASK_CATEGORY_VALUES`: the 10 values in the contract order.
   - `DEFAULT_TASK_CATEGORY = 'other'`.
   - `translateTaskCategory(value)`: returns `Translator.t('game_task.category.<value>')`, using
     `other` when `value` is missing **or not in `TASK_CATEGORY_VALUES`**. That way an unknown
     value from the API never shows a raw key.
   - `toTaskCategoryPick(value)`: returns `{id: value, name: translateTaskCategory(value)}` for
     the picker's `value` prop.
2. **List badge:** in `GameTasksHelper.jsx`, render
   `<Badge text={translateTaskCategory(task.category)} />` next to each task's short description.
3. **Detail modal badge:** in `TaskDetailModalHelper.jsx`'s view mode (not edit mode), show the
   same badge for `state.task?.category`.

Specs:
- `GameTasksHelperSpec.js`: each task row shows its translated category badge; an unknown or
  missing category shows the `other` label.
- A `TaskDetailModalHelper` spec: view mode shows the badge.
- A spec for the new module: order and contents of `TASK_CATEGORY_VALUES`; fallback behavior.

## Files to Change
- `frontend/assets/js/components/resources/game/pages/taskCategories.js` (new): constant,
  default and helpers.
- `frontend/assets/js/components/resources/game/pages/helpers/GameTasksHelper.jsx`: list badge.
- `frontend/assets/js/components/common/modals/helpers/TaskDetailModalHelper.jsx`: view-mode
  badge.
- `frontend/specs/assets/js/components/resources/game/pages/helpers/GameTasksHelperSpec.js`,
  the modal helper spec, and a new `taskCategoriesSpec.js`.

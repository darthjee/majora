import { useEffect, useState } from 'react';
import TaskDetailModalHelper from './helpers/TaskDetailModalHelper.jsx';
import Translator from '../../../i18n/Translator.js';
import { DEFAULT_TASK_CATEGORY } from '../../resources/game/pages/taskCategories.js';

/**
 * Build the edit-form values for a task: its category (defaulting to `other` when missing) and
 * its short/long descriptions (defaulting to empty strings). Used both to initialize the form
 * and to discard edits (cancel, or opening another task). Exported as a plain, named function so
 * it can be exercised directly in specs.
 *
 * @param {object|null} task - Task being viewed/edited, or null when none is selected.
 * @returns {{category: string, shortDescription: string, longDescription: string}} Form values.
 */
export function buildTaskEditValues(task) {
  return {
    category: task?.category ?? DEFAULT_TASK_CATEGORY,
    shortDescription: task?.short_description ?? '',
    longDescription: task?.long_description ?? '',
  };
}

/**
 * Save the edited task values and update the modal state from the result. Clears any previous
 * error and flags the modal as saving while `onSave` runs. On a truthy result it leaves edit
 * mode; on a falsy result (or a rejected `onSave`) it stays in edit mode, keeping the typed
 * values, and sets the translated save error. `saving` is always cleared afterwards. Exported
 * as a plain, named function so it can be exercised directly in specs.
 *
 * @param {Function} onSave - Save handler; resolves to the saved task, or a falsy value on failure.
 * @param {{category: string, shortDescription: string, longDescription: string}} values - Edited
 *   form values passed to `onSave`.
 * @param {object} setters - State setters of the modal.
 * @param {Function} setters.setSaving - Setter for the `saving` flag.
 * @param {Function} setters.setEditing - Setter for the `editing` flag.
 * @param {Function} setters.setError - Setter for the error message.
 * @returns {Promise<void>} Resolves once the modal state has been updated.
 */
export async function submitTaskEdit(onSave, values, { setSaving, setEditing, setError }) {
  setError('');
  setSaving(true);

  let result = null;

  try {
    result = await onSave(values);
  } catch {
    result = null;
  } finally {
    setSaving(false);
  }

  if (result) {
    setEditing(false);
  } else {
    setError(Translator.t('game_task_edit_modal.save_error'));
  }
}

/**
 * View/edit modal for a single game task's category and short/long description.
 * Starts in read-only view mode showing the category and the full `long_description`; the
 * Edit button switches to editable fields with Save/Cancel actions.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {object|null} props.task - Task being viewed/edited, or null when none is selected.
 * @param {Function} props.onClose - Handler invoked when the modal is dismissed.
 * @param {Function} props.onSave - Handler invoked with
 *   `{category, shortDescription, longDescription}` when the edited task is saved. It may
 *   return (a promise of) the saved task; a falsy result keeps the modal in edit mode with an
 *   error message.
 * @returns {React.ReactElement} Rendered task detail modal.
 */
export default function TaskDetailModal({
  show, task, onClose, onSave,
}) {
  const initial = buildTaskEditValues(task);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState(initial.category);
  const [shortDescription, setShortDescription] = useState(initial.shortDescription);
  const [longDescription, setLongDescription] = useState(initial.longDescription);

  const applyValues = (values) => {
    setCategory(values.category);
    setShortDescription(values.shortDescription);
    setLongDescription(values.longDescription);
  };

  useEffect(() => {
    if (!show) return;
    const values = buildTaskEditValues(task);

    setEditing(false);
    setSaving(false);
    setError('');
    setCategory(values.category);
    setShortDescription(values.shortDescription);
    setLongDescription(values.longDescription);
  }, [show, task]);

  const handleEdit = () => {
    setError('');
    setEditing(true);
  };

  const handleCancel = () => {
    applyValues(buildTaskEditValues(task));
    setError('');
    setEditing(false);
  };

  const handleSave = () => submitTaskEdit(
    onSave,
    { category, shortDescription, longDescription },
    { setSaving, setEditing, setError },
  );

  return TaskDetailModalHelper.render(
    show,
    {
      task, editing, saving, error, category, shortDescription, longDescription,
    },
    {
      onClose,
      onEdit: handleEdit,
      onCancel: handleCancel,
      onSave: handleSave,
      onCategoryChange: (item) => setCategory(item.id),
      onShortDescriptionChange: setShortDescription,
      onLongDescriptionChange: setLongDescription,
    },
  );
}

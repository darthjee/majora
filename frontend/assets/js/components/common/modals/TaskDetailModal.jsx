import { useEffect, useState } from 'react';
import TaskDetailModalHelper from './helpers/TaskDetailModalHelper.jsx';
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
 * View/edit modal for a single game task's category and short/long description.
 * Starts in read-only view mode showing the category and the full `long_description`; the
 * Edit button switches to editable fields with Save/Cancel actions.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {object|null} props.task - Task being viewed/edited, or null when none is selected.
 * @param {Function} props.onClose - Handler invoked when the modal is dismissed.
 * @param {Function} props.onSave - Handler invoked with
 *   `{category, shortDescription, longDescription}` when the edited task is saved.
 * @returns {React.ReactElement} Rendered task detail modal.
 */
export default function TaskDetailModal({
  show, task, onClose, onSave,
}) {
  const initial = buildTaskEditValues(task);
  const [editing, setEditing] = useState(false);
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
    setCategory(values.category);
    setShortDescription(values.shortDescription);
    setLongDescription(values.longDescription);
  }, [show, task]);

  const handleEdit = () => setEditing(true);

  const handleCancel = () => {
    applyValues(buildTaskEditValues(task));
    setEditing(false);
  };

  const handleSave = () => {
    onSave({ category, shortDescription, longDescription });
    setEditing(false);
  };

  return TaskDetailModalHelper.render(
    show,
    {
      task, editing, category, shortDescription, longDescription,
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

import { useEffect, useState } from 'react';
import TaskDetailModalHelper from './helpers/TaskDetailModalHelper.jsx';

/**
 * View/edit modal for a single game task's short and long description.
 * Starts in read-only view mode showing the full `long_description`; the
 * Edit button switches to editable fields with Save/Cancel actions.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {object|null} props.task - Task being viewed/edited, or null when none is selected.
 * @param {Function} props.onClose - Handler invoked when the modal is dismissed.
 * @param {Function} props.onSave - Handler invoked with `{shortDescription, longDescription}`
 *   when the edited task is saved.
 * @returns {React.ReactElement} Rendered task detail modal.
 */
export default function TaskDetailModal({
  show, task, onClose, onSave,
}) {
  const [editing, setEditing] = useState(false);
  const [shortDescription, setShortDescription] = useState(task?.short_description ?? '');
  const [longDescription, setLongDescription] = useState(task?.long_description ?? '');

  useEffect(() => {
    if (!show) return;
    setEditing(false);
    setShortDescription(task?.short_description ?? '');
    setLongDescription(task?.long_description ?? '');
  }, [show, task]);

  const handleEdit = () => setEditing(true);

  const handleCancel = () => {
    setShortDescription(task?.short_description ?? '');
    setLongDescription(task?.long_description ?? '');
    setEditing(false);
  };

  const handleSave = () => {
    onSave({ shortDescription, longDescription });
    setEditing(false);
  };

  return TaskDetailModalHelper.render(
    show,
    {
      task, editing, shortDescription, longDescription,
    },
    {
      onClose,
      onEdit: handleEdit,
      onCancel: handleCancel,
      onSave: handleSave,
      onShortDescriptionChange: setShortDescription,
      onLongDescriptionChange: setLongDescription,
    },
  );
}

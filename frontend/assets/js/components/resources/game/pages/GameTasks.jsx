import { useEffect, useMemo, useState } from 'react';
import GameTasksController from './controllers/GameTasksController.js';
import GameTasksHelper from './helpers/GameTasksHelper.jsx';
import TaskDetailModal from '../../../elements/TaskDetailModal.jsx';

const EMPTY_FORM = { shortDescription: '', longDescription: '' };

/**
 * Game Tasks index page, listing checklist-style tasks for a game with an
 * inline add form and a per-task view/edit modal. Gated client-side to the
 * game's GameMaster (or a superuser), since the underlying endpoints 401/403
 * anyone else.
 *
 * @returns {React.ReactElement} Game tasks page element.
 */
export default function GameTasks() {
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [selectedTask, setSelectedTask] = useState(null);

  const controller = useMemo(
    () => new GameTasksController(setTasks, setPagination, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const gameSlug = GameTasksController.getGameSlugFromTasksHash(window.location.hash);
  const basePath = `#/games/${gameSlug}/tasks`;
  const backHref = `#/games/${gameSlug}`;

  const handleToggle = (task) => controller.handleToggleCompleted(gameSlug, task, tasks, setTasks);

  const handleCreate = (event) => controller.handleCreateTask(event, gameSlug, formValues, tasks, {
    setTasks,
    setFieldErrors,
    setError,
    resetForm: () => setFormValues(EMPTY_FORM),
  });

  const handleSaveEdit = (task, values) => controller.handleSaveEdit(gameSlug, task, values, tasks, setTasks);

  if (loading) return GameTasksHelper.renderLoading();
  if (error) return GameTasksHelper.renderError(error);

  return (
    <>
      {GameTasksHelper.render(
        {
          tasks, pagination, basePath, backHref, formValues, fieldErrors,
        },
        {
          onToggle: handleToggle,
          onFormChange: setFormValues,
          onCreate: handleCreate,
          onView: setSelectedTask,
        },
      )}
      <TaskDetailModal
        show={Boolean(selectedTask)}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onSave={(values) => handleSaveEdit(selectedTask, values)}
      />
    </>
  );
}

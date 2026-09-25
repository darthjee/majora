import { useEffect, useMemo, useState } from 'react';
import GameTasksController from './controllers/GameTasksController.js';
import GameTasksHelper from './helpers/GameTasksHelper.jsx';
import TaskFilters from './elements/TaskFilters.jsx';
import TaskDetailModal from '../../../common/modals/TaskDetailModal.jsx';
import FacadeRefresh from '../../../../utils/access/useFacadeRefresh.js';
import HashRouteResolver from '../../../../utils/routing/HashRouteResolver.js';
import { DEFAULT_TASK_CATEGORY } from './taskCategories.js';

/**
 * Initial add-form values: category `other` and empty descriptions.
 */
export const EMPTY_FORM = { category: DEFAULT_TASK_CATEGORY, shortDescription: '', longDescription: '' };

/**
 * Add-form values after a successful create: the descriptions reset, but the last picked
 * category is kept so several tasks of the same kind can be added in a row. Nothing is
 * persisted — a fresh page mount starts from `EMPTY_FORM` again.
 *
 * @param {{category: string}} previous - Form values at the time of the reset.
 * @returns {{category: string, shortDescription: string, longDescription: string}} Reset values.
 */
export function resetTaskFormValues(previous) {
  return { ...EMPTY_FORM, category: previous.category };
}

/**
 * Build the Query/Clear handlers for the tasks filter bar: Query moves the hash to the filtered
 * first page, Clear moves it back to the unfiltered base path; both then re-run the page effect
 * so the list is refetched with the new hash filters.
 *
 * @param {{buildEffect: Function}} controller - Page controller whose effect refetches the tasks.
 * @param {string} basePath - Base hash path of the tasks index (e.g. `#/games/demo/tasks`).
 * @returns {{onQuery: Function, onClear: Function}} Filter bar handlers.
 */
export function buildTaskFilterHandlers(controller, basePath) {
  return {
    onQuery: (filters) => {
      window.location.hash = GameTasksController.buildFilterQueryHash(basePath, filters);
      controller.buildEffect()();
    },
    onClear: () => {
      window.location.hash = basePath;
      controller.buildEffect()();
    },
  };
}

/**
 * Build the task-edit save handler for the detail modal. It saves through the controller and,
 * on success, replaces the modal's selected task with the updated one — only when that task is
 * still the selected one, so a modal closed mid-save is not reopened. The result is returned so
 * the modal can decide whether to leave edit mode.
 *
 * @param {{handleSaveEdit: Function}} controller - Page controller performing the save.
 * @param {string} gameSlug - Slug of the game owning the tasks.
 * @param {Array<object>} tasks - Current task list.
 * @param {Function} setTasks - Setter for the task list.
 * @param {Function} setSelectedTask - Setter for the task shown in the detail modal.
 * @returns {Function} Async `(task, values)` handler resolving to the updated task or `null`.
 */
export function buildSaveEditHandler(controller, gameSlug, tasks, setTasks, setSelectedTask) {
  return async (task, values) => {
    const updated = await controller.handleSaveEdit(gameSlug, task, values, tasks, setTasks);

    if (updated) {
      setSelectedTask((current) => (current && current.id === updated.id ? updated : current));
    }

    return updated;
  };
}

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
  FacadeRefresh.useFacadeRefresh(controller);

  const gameSlug = GameTasksController.getGameSlugFromTasksHash(window.location.hash);
  const basePath = `#/games/${gameSlug}/tasks`;
  const backHref = `#/games/${gameSlug}`;
  const activeFilters = Object.fromEntries(new HashRouteResolver().getFilterParams());

  const filterHandlers = buildTaskFilterHandlers(controller, basePath);

  const handleToggle = (task) => controller.handleToggleCompleted(gameSlug, task, tasks, setTasks);

  const handleCreate = (event) => controller.handleCreateTask(event, gameSlug, formValues, tasks, {
    setTasks,
    setFieldErrors,
    setError,
    resetForm: () => setFormValues(resetTaskFormValues),
  });

  const handleSaveEdit = buildSaveEditHandler(controller, gameSlug, tasks, setTasks, setSelectedTask);

  if (loading) return GameTasksHelper.renderLoading();
  if (error) return GameTasksHelper.renderError(error);

  return (
    <>
      {GameTasksHelper.render(
        {
          tasks,
          pagination,
          basePath,
          backHref,
          formValues,
          fieldErrors,
          activeFilters,
          filters: <TaskFilters onQuery={filterHandlers.onQuery} onClear={filterHandlers.onClear} />,
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

import React, { useEffect, useMemo, useState } from 'react';
import SessionTasksWidgetController from './controllers/SessionTasksWidgetController.js';
import SessionTasksWidgetHelper from './helpers/SessionTasksWidgetHelper.jsx';
import TaskDetailModal from '../../../../common/modals/TaskDetailModal.jsx';
import { saveTaskEdit } from '../../../game/pages/taskMutations.js';

/**
 * Run the widget's fetch effect, only when the widget is visible (the tasks endpoint is
 * DM/superuser-only, so it must never be called for anyone else).
 *
 * @param {{buildEffect: Function}} controller - Widget controller.
 * @param {boolean} visible - Whether the widget is visible.
 * @param {string} gameSlug - Slug of the session's game.
 * @param {number} sessionId - Id of the session.
 * @returns {Function|undefined} The effect cleanup, or undefined when not visible.
 */
export function runSessionTasksEffect(controller, visible, gameSlug, sessionId) {
  if (!visible) {
    return undefined;
  }

  return controller.buildEffect(gameSlug, sessionId)();
}

/**
 * Build the task-edit save handler for the widget's detail modal. On success it replaces the
 * modal's selected task (only when still selected) and, when the saved task no longer belongs
 * to the session, drops it from the list and decrements the total.
 *
 * @param {object} context - Widget context.
 * @param {string} context.gameSlug - Slug of the session's game.
 * @param {number} context.sessionId - Id of the session.
 * @param {object[]} context.tasks - Current tasks list.
 * @param {Function} context.setTasks - Tasks setter.
 * @param {Function} context.setTotal - Total setter.
 * @param {Function} context.setSelectedTask - Setter for the task shown in the detail modal.
 * @returns {Function} Async `(task, values)` handler resolving to the updated task or `null`.
 */
export function buildSessionTaskSaveHandler({
  gameSlug, sessionId, tasks, setTasks, setTotal, setSelectedTask,
}) {
  return async (task, values) => {
    const updated = await saveTaskEdit('SessionTasksWidget', gameSlug, task, values, tasks, setTasks);

    if (!updated) {
      return null;
    }

    setSelectedTask((current) => (current && current.id === updated.id ? updated : current));

    if (updated.session?.id !== sessionId) {
      setTasks((current) => current.filter((item) => item.id !== updated.id));
      setTotal((current) => current - 1);
    }

    return updated;
  };
}

/**
 * Build the list handlers of the widget.
 *
 * @param {{handleToggle: Function}} controller - Widget controller.
 * @param {object} context - Widget context.
 * @param {string} context.gameSlug - Slug of the session's game.
 * @param {object[]} context.tasks - Current tasks list.
 * @param {Function} context.setTasks - Tasks setter.
 * @param {Function} context.setSelectedTask - Setter for the task shown in the detail modal.
 * @returns {{onToggle: Function, onView: Function}} List handlers.
 */
export function buildSessionTaskHandlers(controller, {
  gameSlug, tasks, setTasks, setSelectedTask,
}) {
  return {
    onToggle: (task) => controller.handleToggle(gameSlug, task, tasks, setTasks),
    onView: (task) => setSelectedTask(task),
  };
}

/**
 * Self-fetching widget rendered on the game session page, listing the session's first tasks
 * as a checklist (toggle, view/edit modal) with a link to the game Tasks page filtered by the
 * session when there are more. Visible only when the session is editable by the current user
 * (DM/superuser); renders nothing, and fetches nothing, otherwise.
 *
 * @param {object} props - Component props.
 * @param {object} props.session - Session data object, needing `id`, `game_slug` and `can_edit`.
 * @returns {React.ReactElement|null} The widget element, or `null` when not visible.
 */
export default function SessionTasksWidget({ session }) {
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const visible = Boolean(session?.can_edit);

  const controller = useMemo(
    () => new SessionTasksWidgetController(setTasks, setTotal, setLoading, setError),
    [],
  );

  useEffect(
    () => runSessionTasksEffect(controller, visible, session?.game_slug, session?.id),
    [controller, visible, session?.game_slug, session?.id],
  );

  if (!visible) {
    return null;
  }

  const gameSlug = session.game_slug;
  const context = {
    gameSlug, sessionId: session.id, tasks, setTasks, setTotal, setSelectedTask,
  };
  const handleSave = buildSessionTaskSaveHandler(context);

  return (
    <>
      {SessionTasksWidgetHelper.render(
        {
          tasks, total, loading, error, gameSlug, sessionId: session.id,
        },
        buildSessionTaskHandlers(controller, context),
      )}
      <TaskDetailModal
        show={Boolean(selectedTask)}
        task={selectedTask}
        gameSlug={gameSlug}
        onClose={() => setSelectedTask(null)}
        onSave={(values) => handleSave(selectedTask, values)}
      />
    </>
  );
}

import RequestStore from '../../../../../../utils/requests/RequestStore.js';
import Translator from '../../../../../../i18n/Translator.js';
import { toggleTaskCompleted } from '../../../../game/pages/taskMutations.js';

/**
 * Maximum number of tasks the session tasks widget lists.
 */
export const SESSION_TASKS_PER_PAGE = '5';

/**
 * Manages the session tasks fetch and completion toggling for the SessionTasksWidget element.
 *
 * @description The tasks endpoint is DM/superuser-only, so the widget only builds this
 *   controller's effect once the session is known to be editable.
 */
export default class SessionTasksWidgetController {
  /**
   * Creates a new SessionTasksWidgetController instance.
   *
   * @param {Function} setTasks - State setter for the tasks list.
   * @param {Function} setTotal - State setter for the total number of the session's tasks.
   * @param {Function} setLoading - State setter for the loading flag.
   * @param {Function} setError - State setter for the error message.
   */
  constructor(setTasks, setTotal, setLoading, setError) {
    this.setTasks = setTasks;
    this.setTotal = setTotal;
    this.setLoading = setLoading;
    this.setError = setError;
  }

  /**
   * Build the widget effect, fetching the first tasks of the session (capped at
   * `SESSION_TASKS_PER_PAGE`) together with the session's total task count.
   *
   * @param {string} gameSlug - Slug of the session's game.
   * @param {number} sessionId - Id of the session whose tasks are listed.
   * @returns {Function} Effect callback, returning its cleanup function.
   */
  buildEffect(gameSlug, sessionId) {
    return () => {
      let mounted = true;
      const safeSet = (setter, value) => {
        if (mounted) {
          setter(value);
        }
      };

      RequestStore.ensure({
        componentName: 'SessionTasksWidgetController',
        resource: 'task',
        quantityType: 'collection',
        params: { gameSlug },
        query: { session: String(sessionId), per_page: SESSION_TASKS_PER_PAGE },
      })
        .then(({ data, pagination }) => {
          safeSet(this.setTasks, Array.isArray(data) ? data : []);
          safeSet(this.setTotal, pagination?.total ?? 0);
        })
        .catch(() => safeSet(this.setError, Translator.t('game_session_page.tasks_error')))
        .finally(() => safeSet(this.setLoading, false));

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Toggles a task's `completed` flag optimistically, rolling back on failure.
   *
   * @param {string} gameSlug - Slug of the task's game.
   * @param {object} task - Task to toggle.
   * @param {object[]} tasks - Current tasks list.
   * @param {Function} setTasks - Tasks setter.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  handleToggle(gameSlug, task, tasks, setTasks) {
    return toggleTaskCompleted('SessionTasksWidgetController', gameSlug, task, tasks, setTasks);
  }
}

import GameTaskClient from '../../../../../client/GameTaskClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';

/**
 * Controller for the game tasks index page.
 *
 * @description Unlike most other index pages, the tasks endpoints
 *   themselves 401/403 non-editors, so this controller checks
 *   `game.can_edit` before ever calling them, redirecting away otherwise.
 */
export default class GameTasksController extends BasePageController {
  /**
   * Extract game slug from a tasks index hash.
   *
   * @param {string} hash - Current hash.
   * @returns {string} Game slug.
   */
  static getGameSlugFromTasksHash(hash = '') {
    return BasePageController.extractParam('/games/:game_slug/tasks', 'game_slug', hash);
  }

  /**
   * Create a game tasks controller.
   *
   * @param {Function} setTasks - Tasks setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GameTaskClient|null} [taskClient] - Task client override.
   */
  constructor(
    setTasks,
    setPagination,
    setLoading,
    setError,
    taskClient = null,
  ) {
    super();
    this.setTasks = setTasks;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.taskClient = taskClient ?? new GameTaskClient();
  }

  /**
   * Build the page mount effect.
   *
   * @description Checks whether the current user may edit the game and
   *   redirects to the game page when they cannot, before ever calling the
   *   tasks endpoints (which would otherwise 401/403).
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const hash = typeof window === 'undefined' ? '' : window.location.hash;
      const gameSlug = GameTasksController.getGameSlugFromTasksHash(hash);

      AccessStore.ensureGamePermissions(gameSlug)
        .then((permissions) => this.#handlePermissions(permissions, gameSlug, safeSet))
        .catch(() => this.#redirectToGame(gameSlug));

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Toggles a task's `completed` flag, updating local state immediately and
   * rolling back when the request fails.
   *
   * @param {string} gameSlug - Game slug.
   * @param {object} task - Task to toggle.
   * @param {object[]} tasks - Current tasks list.
   * @param {Function} setTasks - Tasks setter.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async handleToggleCompleted(gameSlug, task, tasks, setTasks) {
    const token = AuthStorage.getToken();
    const nextCompleted = !task.completed;

    setTasks(GameTasksController.#replaceTask(tasks, task.id, { ...task, completed: nextCompleted }));

    try {
      const response = await this.taskClient.updateTask(gameSlug, task.id, token, { completed: nextCompleted });

      if (!response.ok) {
        setTasks(tasks);
        return;
      }

      const data = await response.json();
      setTasks(GameTasksController.#replaceTask(tasks, task.id, data));
    } catch {
      setTasks(tasks);
    }
  }

  /**
   * Submits the inline add-task form.
   *
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {{shortDescription: string, longDescription: string}} formValues - Raw form values.
   * @param {object[]} tasks - Current tasks list.
   * @param {{setTasks: Function, setFieldErrors: Function, setError: Function,
   *   resetForm: Function}} setters - Page state setters.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async handleCreateTask(event, gameSlug, formValues, tasks, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setFieldErrors({});
    setters.setError('');

    const token = AuthStorage.getToken();

    try {
      const response = await this.taskClient.createTask(gameSlug, token, {
        short_description: formValues.shortDescription,
        long_description: formValues.longDescription,
      });

      await this.#handleCreateResponse(response, tasks, setters);
    } catch {
      setters.setError('Unable to create task.');
    }
  }

  /**
   * Saves edits to a task's short/long description.
   *
   * @param {string} gameSlug - Game slug.
   * @param {object} task - Task being edited.
   * @param {{shortDescription: string, longDescription: string}} formValues - Edited values.
   * @param {object[]} tasks - Current tasks list.
   * @param {Function} setTasks - Tasks setter.
   * @returns {Promise<object|null>} The updated task on success, or null on failure.
   */
  async handleSaveEdit(gameSlug, task, formValues, tasks, setTasks) {
    const token = AuthStorage.getToken();

    try {
      const response = await this.taskClient.updateTask(gameSlug, task.id, token, {
        short_description: formValues.shortDescription,
        long_description: formValues.longDescription,
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      setTasks(GameTasksController.#replaceTask(tasks, task.id, data));
      return data;
    } catch {
      return null;
    }
  }

  static #replaceTask(tasks, id, updatedTask) {
    return tasks.map((item) => (item.id === id ? updatedTask : item));
  }

  #handlePermissions(permissions, gameSlug, safeSet) {
    if (!permissions.can_edit) {
      this.#redirectToGame(gameSlug);
      return;
    }

    this.#fetchTasks(gameSlug, safeSet);
  }

  #redirectToGame(gameSlug) {
    if (typeof window !== 'undefined') {
      window.location.hash = `/games/${gameSlug}`;
    }
  }

  #fetchTasks(gameSlug, safeSet) {
    const token = AuthStorage.getToken();
    const params = new HashRouteResolver().getPaginationParams();

    this.taskClient.fetchTasks(gameSlug, token, params)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Request failed');
        }

        return response.json().then((data) => ({ data, headers: response.headers }));
      })
      .then(({ data, headers }) => {
        safeSet(this.setTasks, Array.isArray(data) ? data : []);
        safeSet(this.setPagination, {
          page: this.#parseInt(headers.get('page'), 1),
          pages: this.#parseInt(headers.get('pages'), 1),
          perPage: this.#parseInt(headers.get('per_page'), 10),
        });
      })
      .catch(() => safeSet(this.setError, 'Unable to load tasks.'))
      .finally(() => safeSet(this.setLoading, false));
  }

  async #handleCreateResponse(response, tasks, setters) {
    if (response.status === 201) {
      const data = await response.json();
      setters.setTasks([...tasks, data]);
      setters.resetForm();
      return;
    }

    const data = await response.json();
    const errors = data.errors ?? {};

    if (response.status === 400) {
      setters.setFieldErrors(errors);
      return;
    }

    setters.setError('Unable to create task.');
  }

  #parseInt(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
  }
}

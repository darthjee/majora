import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

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
   */
  constructor(
    setTasks,
    setPagination,
    setLoading,
    setError,
  ) {
    super();
    this.setTasks = setTasks;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
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
      const hash = getCurrentHash();
      const gameSlug = GameTasksController.getGameSlugFromTasksHash(hash);

      AccessStore.ensureGamePermissions(gameSlug)
        .then((permissions) => this.#handlePermissions(permissions, gameSlug, safeSet))
        .catch(() => this.redirectTo(`/games/${gameSlug}`));

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
    const nextCompleted = !task.completed;

    setTasks(GameTasksController.#replaceTask(tasks, task.id, { ...task, completed: nextCompleted }));

    try {
      const response = await RequestStore.mutate({
        componentName: 'GameTasksController',
        resource: 'task',
        method: 'PATCH',
        quantityType: 'single',
        params: { gameSlug, id: task.id },
        body: { completed: nextCompleted },
      });

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

    try {
      const response = await RequestStore.mutate({
        componentName: 'GameTasksController',
        resource: 'task',
        method: 'POST',
        quantityType: 'collection',
        params: { gameSlug },
        body: {
          short_description: formValues.shortDescription,
          long_description: formValues.longDescription,
        },
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
    try {
      const response = await RequestStore.mutate({
        componentName: 'GameTasksController',
        resource: 'task',
        method: 'PATCH',
        quantityType: 'single',
        params: { gameSlug, id: task.id },
        body: {
          short_description: formValues.shortDescription,
          long_description: formValues.longDescription,
        },
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
      this.redirectTo(`/games/${gameSlug}`);
      return;
    }

    this.#fetchTasks(gameSlug, safeSet);
  }

  #fetchTasks(gameSlug, safeSet) {
    const params = new HashRouteResolver().getPaginationParams();

    RequestStore.ensure({
      componentName: 'GameTasksController',
      resource: 'task',
      quantityType: 'collection',
      params: { gameSlug },
      query: Object.fromEntries(params),
    })
      .then(({ data, pagination }) => {
        safeSet(this.setTasks, Array.isArray(data) ? data : []);
        safeSet(this.setPagination, pagination);
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
}

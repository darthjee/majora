import BaseClient from './BaseClient.js';

/**
 * HTTP client for game task requests (list, create, and update). Unlike
 * most other list/detail endpoints, every Task endpoint requires the
 * authentication token, since tasks are private to the game's GameMaster.
 */
export default class GameTaskClient extends BaseClient {
  /**
   * Fetches the paginated list of tasks for a game.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token, if any.
   * @param {URLSearchParams} [params] - Pagination query params.
   * @returns {Promise<Response>} fetch response from the game tasks index endpoint.
   */
  fetchTasks(gameSlug, token, params = new URLSearchParams()) {
    const query = params.toString();
    const path = query ? `/games/${gameSlug}/tasks.json?${query}` : `/games/${gameSlug}/tasks.json`;

    return this.getJson(path, token);
  }

  /**
   * Creates a new task for a game.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} fields - Fields for the new task.
   * @param {string} fields.short_description - Short description of the task.
   * @param {string} [fields.long_description] - Long description of the task.
   * @param {boolean} [fields.completed] - Whether the task is already completed.
   * @returns {Promise<Response>} fetch response from the game tasks endpoint.
   */
  createTask(gameSlug, token, fields) {
    return this.postJson(`/games/${gameSlug}/tasks.json`, token, fields);
  }

  /**
   * Submits a partial update for a task.
   *
   * @param {string} gameSlug - Game slug.
   * @param {number|string} id - Task id.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} fields - Fields to update.
   * @returns {Promise<Response>} fetch response from the task endpoint.
   */
  updateTask(gameSlug, id, token, fields) {
    return this.patchJson(`/games/${gameSlug}/tasks/${id}.json`, token, fields);
  }
}

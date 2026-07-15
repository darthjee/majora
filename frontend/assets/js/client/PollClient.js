import BaseClient from './BaseClient.js';

/**
 * HTTP client for game poll requests (list, detail, and create).
 */
export default class PollClient extends BaseClient {
  /**
   * Fetches the paginated list of polls for a game.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token, if any.
   * @param {URLSearchParams} [params] - Pagination/filter query params.
   * @returns {Promise<Response>} fetch response from the game polls index endpoint.
   */
  fetchPolls(gameSlug, token, params = new URLSearchParams()) {
    const query = params.toString();
    const path = query ? `/games/${gameSlug}/polls.json?${query}` : `/games/${gameSlug}/polls.json`;

    return this.getJson(path, token);
  }

  /**
   * Fetches the details of a game poll, including its options.
   *
   * @param {string} gameSlug - Game slug.
   * @param {number|string} id - Poll id.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the poll endpoint.
   */
  fetchPoll(gameSlug, id, token) {
    return this.getJson(`/games/${gameSlug}/polls/${id}.json`, token);
  }

  /**
   * Creates a new poll (and its options) for a game.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} fields - Fields for the new poll.
   * @param {string} fields.title - Poll title.
   * @param {string} [fields.description] - Poll description.
   * @param {string} fields.type - Poll type (`'single'` or `'multiple'`).
   * @param {{option: string}[]} fields.options - Poll options.
   * @returns {Promise<Response>} fetch response from the game polls endpoint.
   */
  createPoll(gameSlug, token, fields) {
    return this.postJson(`/games/${gameSlug}/polls.json`, token, fields);
  }
}

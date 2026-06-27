import BaseClient from './BaseClient.js';

/**
 * HTTP client for game requests (fetch, access check, and update).
 */
export default class GameClient extends BaseClient {
  /**
   * Fetches the details of a game.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the game endpoint.
   */
  fetchGame(gameSlug, token) {
    return this.request(`/games/${gameSlug}.json`, {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
    });
  }

  /**
   * Fetches the access permissions for a game.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the game access endpoint.
   */
  fetchGameAccess(gameSlug, token) {
    return this.request(`/games/${gameSlug}/access.json`, {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
    });
  }

  /**
   * Submits a partial update for a game.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} fields - Fields to update.
   * @returns {Promise<Response>} fetch response from the game endpoint.
   */
  updateGame(gameSlug, token, fields) {
    return this.request(`/games/${gameSlug}.json`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      body: JSON.stringify(fields),
    });
  }
}

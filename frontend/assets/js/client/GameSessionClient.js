import BaseClient from './BaseClient.js';

/**
 * HTTP client for game session requests (fetch, create, and update).
 */
export default class GameSessionClient extends BaseClient {
  /**
   * Fetches the details of a game session.
   *
   * @param {string} gameSlug - Game slug.
   * @param {number|string} id - Session id.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the session endpoint.
   */
  fetchSession(gameSlug, id, token) {
    return this.request(`/games/${gameSlug}/sessions/${id}.json`, {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
    });
  }

  /**
   * Creates a new game session.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} fields - Fields for the new session.
   * @param {string} fields.title - Session title.
   * @param {string|null} [fields.date] - Session date (YYYY-MM-DD), if any.
   * @returns {Promise<Response>} fetch response from the sessions endpoint.
   */
  createSession(gameSlug, token, fields) {
    return this.request(`/games/${gameSlug}/sessions.json`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      body: JSON.stringify(fields),
    });
  }

  /**
   * Submits a partial update for a game session.
   *
   * @param {string} gameSlug - Game slug.
   * @param {number|string} id - Session id.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} fields - Fields to update.
   * @returns {Promise<Response>} fetch response from the session endpoint.
   */
  updateSession(gameSlug, id, token, fields) {
    return this.request(`/games/${gameSlug}/sessions/${id}.json`, {
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

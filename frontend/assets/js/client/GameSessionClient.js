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
    return this.getJson(`/games/${gameSlug}/sessions/${id}.json`, token);
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
    return this.postJson(`/games/${gameSlug}/sessions.json`, token, fields);
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
    return this.patchJson(`/games/${gameSlug}/sessions/${id}.json`, token, fields);
  }

  /**
   * Fetches a page of a session's messages.
   *
   * @param {string} gameSlug - Game slug.
   * @param {number|string} sessionId - Session id.
   * @param {string|null} token - Authentication token, if any.
   * @param {number|string|null} [nextEntryId] - Cursor from a previous page's NEXT-ENTRY-ID header.
   * @returns {Promise<Response>} fetch response from the messages endpoint.
   */
  fetchMessages(gameSlug, sessionId, token, nextEntryId) {
    const query = nextEntryId ? `?next-entry-id=${nextEntryId}` : '';
    return this.getJson(`/games/${gameSlug}/sessions/${sessionId}/messages.json${query}`, token);
  }

  /**
   * Posts a new message to a session.
   *
   * @param {string} gameSlug - Game slug.
   * @param {number|string} sessionId - Session id.
   * @param {string|null} token - Authentication token, if any.
   * @param {string} content - Message content.
   * @returns {Promise<Response>} fetch response from the messages endpoint.
   */
  createMessage(gameSlug, sessionId, token, content) {
    return this.postJson(`/games/${gameSlug}/sessions/${sessionId}/messages.json`, token, { content });
  }
}

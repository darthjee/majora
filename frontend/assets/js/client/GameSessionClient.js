import BaseClient from './BaseClient.js';

/**
 * HTTP client for game session requests (fetch).
 *
 * @description Create/update and the message-post/poll-proposal mutations moved to
 *   `RequestStore.mutate()` (issue #842) — this client now only holds read methods.
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
}

import BaseClient from './BaseClient.js';

/**
 * HTTP client for game requests (fetch and access check).
 *
 * @description Game-level item/document creation moved to `RequestStore.mutate()` (issue #841) —
 *   this client no longer holds `createItem`/`createDocument`. Game creation/update also moved to
 *   `RequestStore.mutate()` (issue #844) — this client no longer holds `createGame`/`updateGame`.
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
    return this.getJson(`/games/${gameSlug}.json`, token);
  }

  /**
   * Fetches the access permissions for a game.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token, if any.
   * @param {AbortSignal} [signal] - Optional abort signal for the request.
   * @returns {Promise<Response>} fetch response from the game access endpoint.
   */
  fetchGameAccess(gameSlug, token, signal) {
    return this.getJson(`/games/${gameSlug}/access.json`, token, {}, signal);
  }

  /**
   * Fetches the edit permissions for a game.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token, if any.
   * @param {AbortSignal} [signal] - Optional abort signal for the request.
   * @param {string[]} [roles] - Roles to simulate instead of the requester's own identity
   *   (serialized as repeated `role=` query params). Defaults to the requester's real identity.
   * @returns {Promise<Response>} fetch response from the game permissions endpoint.
   */
  fetchGamePermissions(gameSlug, token, signal, roles = []) {
    return this.getJson(`/permissions/game.json${this.buildRoleQuery(roles)}`, token, {}, signal);
  }

}

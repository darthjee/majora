import BaseClient from './BaseClient.js';

/**
 * HTTP client for single-player and player-conversations requests (issue #695).
 */
export default class PlayerClient extends BaseClient {
  /**
   * Fetches a single player of a game, in the same shape as one item of the players list
   * (`PlayerListSerializer`: `id`, `user`, `character`).
   *
   * @param {string} gameSlug - Game slug.
   * @param {number|string} id - Player id.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the player endpoint.
   */
  fetchPlayer(gameSlug, id, token) {
    return this.getJson(`/games/${gameSlug}/players/${id}.json`, token);
  }

  /**
   * Fetches a page of conversations shared between the requesting user and another player
   * of the same game.
   *
   * @param {string} gameSlug - Game slug.
   * @param {number|string} playerId - Id of the other player the conversations are shared with.
   * @param {string|null} token - Authentication token, if any.
   * @param {URLSearchParams} [params] - Pagination query params (`page`/`per_page`).
   * @returns {Promise<Response>} fetch response from the conversations endpoint.
   */
  fetchConversations(gameSlug, playerId, token, params = new URLSearchParams()) {
    const query = new URLSearchParams(params);
    query.set('player_id', playerId);

    return this.getJson(`/games/${gameSlug}/conversations.json?${query.toString()}`, token);
  }
}

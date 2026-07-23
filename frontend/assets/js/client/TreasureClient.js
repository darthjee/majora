import BaseClient from './BaseClient.js';

/**
 * HTTP client for treasure requests (fetch, access check, create, and update).
 */
export default class TreasureClient extends BaseClient {
  /**
   * Fetches the details of a treasure.
   *
   * @param {number|string} id - Treasure id.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the treasure endpoint.
   */
  fetchTreasure(id, token) {
    return this.getJson(`/treasures/${id}.json`, token);
  }

  /**
   * Fetches the access permissions for a treasure.
   *
   * @param {number|string} id - Treasure id.
   * @param {string|null} token - Authentication token, if any.
   * @param {AbortSignal} [signal] - Optional abort signal for the request.
   * @returns {Promise<Response>} fetch response from the treasure access endpoint.
   */
  fetchTreasureAccess(id, token, signal) {
    return this.getJson(`/treasures/${id}/access.json`, token, {}, signal);
  }

  /**
   * Fetches the edit permissions for a treasure.
   *
   * @param {number|string} id - Treasure id.
   * @param {string|null} token - Authentication token, if any.
   * @param {AbortSignal} [signal] - Optional abort signal for the request.
   * @param {string[]} [roles] - Roles to simulate instead of the requester's own identity
   *   (serialized as repeated `role=` query params). Defaults to the requester's real identity.
   * @returns {Promise<Response>} fetch response from the treasure permissions endpoint.
   */
  fetchTreasurePermissions(id, token, signal, roles = []) {
    return this.getJson(`/treasures/${id}/permissions.json${this.buildRoleQuery(roles)}`, token, {}, signal);
  }

  /**
   * Creates a new treasure.
   *
   * @param {string|null} token - Authentication token, if any.
   * @param {object} fields - Fields for the new treasure.
   * @param {string} fields.name - Treasure name.
   * @param {number} fields.value - Treasure value.
   * @returns {Promise<Response>} fetch response from the treasures endpoint.
   */
  createTreasure(token, fields) {
    return this.postJson('/treasures.json', token, fields);
  }

  /**
   * Submits a partial update for a treasure.
   *
   * @param {number|string} id - Treasure id.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} fields - Fields to update.
   * @returns {Promise<Response>} fetch response from the treasure endpoint.
   */
  updateTreasure(id, token, fields) {
    return this.patchJson(`/treasures/${id}.json`, token, fields);
  }

  /**
   * Creates a new treasure exclusive to a game.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} fields - Fields for the new treasure.
   * @param {string} fields.name - Treasure name.
   * @param {number} fields.value - Treasure value.
   * @returns {Promise<Response>} fetch response from the game treasures endpoint.
   */
  createGameTreasure(gameSlug, token, fields) {
    return this.postJson(`/games/${gameSlug}/treasures.json`, token, fields);
  }

  /**
   * Fetches an explicit page of a game's treasures, optionally capped to a maximum
   * value, filtered by name, and sorted by value. Used by the treasure exchange
   * modal's Buy tab (local pagination, independent of the URL).
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token, if any.
   * @param {{page: number, perPage: number, maxValue: number|null, search: string,
   *   ordering: string}} [params] - Query params. `search` is a case-insensitive
   *   substring match on the treasure name, sent as the endpoint's `name` query param.
   *   `ordering` is `'asc'` or `'desc'` (defaults to `'asc'` on the backend).
   * @returns {Promise<Response>} fetch response from the game treasures endpoint.
   */
  fetchGameTreasuresPage(gameSlug, token, { page, perPage, maxValue, search, ordering } = {}) {
    const query = this.buildQuery([
      ['page', page], ['per_page', perPage], ['max_value', maxValue], ['name', search], ['ordering', ordering],
    ]).toString();

    return this.getJson(`/games/${gameSlug}/treasures.json${query ? `?${query}` : ''}`, token);
  }

  /**
   * Fetches an explicit page of a game's full treasure catalog, including hidden
   * treasures (DM/admin-only endpoint). Mirrors {@link fetchGameTreasuresPage}'s
   * params/pagination handling; each returned item additionally carries a
   * `hidden` boolean field. Used by the treasure exchange modal's Buy tab
   * when the requester can edit the game, so a DM can browse (and later buy)
   * hidden treasures without a 404.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token, if any.
   * @param {{page: number, perPage: number, maxValue: number|null, search: string,
   *   ordering: string}} [params] - Query params. `search` is a case-insensitive
   *   substring match on the treasure name, sent as the endpoint's `name` query param.
   *   `ordering` is `'asc'` or `'desc'` (defaults to `'asc'` on the backend).
   * @returns {Promise<Response>} fetch response from the game treasures/all endpoint.
   */
  fetchGameTreasuresAllPage(gameSlug, token, { page, perPage, maxValue, search, ordering } = {}) {
    const query = this.buildQuery([
      ['page', page], ['per_page', perPage], ['max_value', maxValue], ['name', search], ['ordering', ordering],
    ]).toString();

    return this.getJson(`/games/${gameSlug}/treasures/all.json${query ? `?${query}` : ''}`, token);
  }

  /**
   * Fetches the details of a game-scoped treasure.
   *
   * @param {string} gameSlug - Game slug.
   * @param {number|string} id - Treasure id.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the game treasure endpoint.
   */
  fetchGameTreasure(gameSlug, id, token) {
    return this.getJson(`/games/${gameSlug}/treasures/${id}.json`, token);
  }

  /**
   * Fetches an explicit page of catalog treasures matching a game's `game_type` that are not
   * yet linked to it as a `GameTreasure` (DM/admin-only endpoint). Mirrors
   * {@link fetchGameTreasuresAllPage}'s pagination-only param handling — this endpoint does not
   * support `maxValue`/`search`/`ordering`. Used by the Add Treasure modal's browse list.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token, if any.
   * @param {{page: number, perPage: number}} [params] - Pagination params.
   * @returns {Promise<Response>} fetch response from the game treasures/missing endpoint.
   */
  fetchMissingGameTreasuresPage(gameSlug, token, { page, perPage } = {}) {
    const query = this.buildQuery([['page', page], ['per_page', perPage]]).toString();

    return this.getJson(`/games/${gameSlug}/treasures/missing.json${query ? `?${query}` : ''}`, token);
  }

  /**
   * Links an existing catalog treasure to a game, creating the corresponding `GameTreasure`
   * row.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} fields - Fields for the new link.
   * @param {number} fields.treasure_id - Id of the catalog treasure to link.
   * @param {number} fields.value - Game-specific value for the linked treasure.
   * @param {boolean} [fields.hidden] - Whether the linked treasure starts hidden.
   * @param {number|null} [fields.max_units] - Maximum obtainable units within the game, or
   *   `null` for unlimited.
   * @returns {Promise<Response>} fetch response from the game treasures/link endpoint.
   */
  linkGameTreasure(gameSlug, token, fields) {
    return this.postJson(`/games/${gameSlug}/treasures/link.json`, token, fields);
  }

  /**
   * Submits a partial update for a game-scoped treasure.
   *
   * @param {string} gameSlug - Game slug.
   * @param {number|string} id - Treasure id.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} fields - Fields to update.
   * @param {number|null} [fields.max_units] - Maximum obtainable units within the game, for
   *   M2M-linked treasures (`null` for unlimited). Ignored for exclusive treasures.
   * @returns {Promise<Response>} fetch response from the game treasure endpoint.
   */
  updateGameTreasure(gameSlug, id, token, fields) {
    return this.patchJson(`/games/${gameSlug}/treasures/${id}.json`, token, fields);
  }
}

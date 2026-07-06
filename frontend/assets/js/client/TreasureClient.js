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
    return this.request(`/treasures/${id}.json`, {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
    });
  }

  /**
   * Fetches the access permissions for a treasure.
   *
   * @param {number|string} id - Treasure id.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the treasure access endpoint.
   */
  fetchTreasureAccess(id, token) {
    return this.request(`/treasures/${id}/access.json`, {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
    });
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
    return this.request('/treasures.json', {
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
   * Submits a partial update for a treasure.
   *
   * @param {number|string} id - Treasure id.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} fields - Fields to update.
   * @returns {Promise<Response>} fetch response from the treasure endpoint.
   */
  updateTreasure(id, token, fields) {
    return this.request(`/treasures/${id}.json`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      body: JSON.stringify(fields),
    });
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
    return this.request(`/games/${gameSlug}/treasures.json`, {
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
   * Fetches an explicit page of a game's treasures, optionally capped to a maximum
   * value. Used by the treasure exchange modal's Acquire tab (local pagination,
   * independent of the URL).
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token, if any.
   * @param {{page: number, perPage: number, maxValue: number|null}} [params] - Query params.
   * @returns {Promise<Response>} fetch response from the game treasures endpoint.
   */
  fetchGameTreasuresPage(gameSlug, token, { page, perPage, maxValue } = {}) {
    const search = new URLSearchParams();

    if (page) search.set('page', page);
    if (perPage) search.set('per_page', perPage);
    if (maxValue !== undefined && maxValue !== null) search.set('max_value', maxValue);

    const query = search.toString();

    return this.request(`/games/${gameSlug}/treasures.json${query ? `?${query}` : ''}`, {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
    });
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
    return this.request(`/games/${gameSlug}/treasures/${id}.json`, {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
    });
  }

  /**
   * Submits a partial update for a game-scoped treasure.
   *
   * @param {string} gameSlug - Game slug.
   * @param {number|string} id - Treasure id.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} fields - Fields to update.
   * @returns {Promise<Response>} fetch response from the game treasure endpoint.
   */
  updateGameTreasure(gameSlug, id, token, fields) {
    return this.request(`/games/${gameSlug}/treasures/${id}.json`, {
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

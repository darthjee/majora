import BaseClient from './BaseClient.js';

/**
 * HTTP client for PC character requests (fetch and update).
 */
export default class CharacterClient extends BaseClient {
  /**
   * Fetches the details of a PC character.
   *
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the character endpoint.
   */
  fetchPc(gameSlug, characterId, token) {
    return this.request(`/games/${gameSlug}/pcs/${characterId}.json`, {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
    });
  }

  /**
   * Submits a partial update for a PC character.
   *
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} fields - Fields to update.
   * @returns {Promise<Response>} fetch response from the character endpoint.
   */
  updatePc(gameSlug, characterId, token, fields) {
    return this.request(`/games/${gameSlug}/pcs/${characterId}.json`, {
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

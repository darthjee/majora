import BaseClient from './BaseClient.js';

/**
 * HTTP client for PC and NPC character requests (fetch and update).
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
    return this.#fetchCharacter('pcs', gameSlug, characterId, token);
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
    return this.#updateCharacter('pcs', gameSlug, characterId, token, fields);
  }

  /**
   * Fetches the details of an NPC character.
   *
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the character endpoint.
   */
  fetchNpc(gameSlug, characterId, token) {
    return this.#fetchCharacter('npcs', gameSlug, characterId, token);
  }

  /**
   * Submits a partial update for an NPC character.
   *
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} fields - Fields to update.
   * @returns {Promise<Response>} fetch response from the character endpoint.
   */
  updateNpc(gameSlug, characterId, token, fields) {
    return this.#updateCharacter('npcs', gameSlug, characterId, token, fields);
  }

  #fetchCharacter(segment, gameSlug, characterId, token) {
    return this.request(`/games/${gameSlug}/${segment}/${characterId}.json`, {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
    });
  }

  #updateCharacter(segment, gameSlug, characterId, token, fields) {
    return this.request(`/games/${gameSlug}/${segment}/${characterId}.json`, {
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

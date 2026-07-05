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
   * Fetches the full details of a PC character (editor-only endpoint).
   *
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the character full endpoint.
   */
  fetchPcFull(gameSlug, characterId, token) {
    return this.#fetchCharacter('pcs', gameSlug, characterId, token, 'full');
  }

  /**
   * Fetches the access permissions for a PC character.
   *
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the character access endpoint.
   */
  fetchPcAccess(gameSlug, characterId, token) {
    return this.#fetchCharacter('pcs', gameSlug, characterId, token, 'access');
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
   * Fetches the full details of an NPC character (editor-only endpoint).
   *
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the character full endpoint.
   */
  fetchNpcFull(gameSlug, characterId, token) {
    return this.#fetchCharacter('npcs', gameSlug, characterId, token, 'full');
  }

  /**
   * Fetches the access permissions for an NPC character.
   *
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the character access endpoint.
   */
  fetchNpcAccess(gameSlug, characterId, token) {
    return this.#fetchCharacter('npcs', gameSlug, characterId, token, 'access');
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

  /**
   * Creates a new NPC character for a game.
   *
   * @param {string} gameSlug - Game slug the NPC will belong to.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} fields - NPC fields (`name`, `role`, `public_description`,
   *   `private_description`, `hidden`, `money`).
   * @returns {Promise<Response>} fetch response from the npcs endpoint.
   */
  createNpc(gameSlug, token, fields) {
    return this.request(`/games/${gameSlug}/npcs.json`, {
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
   * Fetches all NPCs (including hidden) for a game (DM-only endpoint).
   * Returns a raw Response so callers can inspect the status code
   * and fall back gracefully on 401 or 403.
   *
   * @param {string} gameSlug - Game slug the NPCs belong to.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} [params] - Query parameters (e.g. { per_page: 6 }).
   * @returns {Promise<Response>} fetch response from the npcs/all endpoint.
   */
  fetchNpcsAll(gameSlug, token, params = {}) {
    const query = new URLSearchParams(params).toString();
    const path = `/games/${gameSlug}/npcs/all.json${query ? `?${query}` : ''}`;
    return this.request(path, {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
    });
  }

  /**
   * Sets the roles of a PC character photo (e.g. marking it as the profile photo).
   *
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string|number} photoId - Photo id to update.
   * @param {string|null} token - Authentication token, if any.
   * @param {string[]} roles - Roles to assign to the photo (e.g. `['profile']`).
   * @returns {Promise<Response>} fetch response from the photo set endpoint.
   */
  setPcPhotoRoles(gameSlug, characterId, photoId, token, roles) {
    return this.#setPhotoRoles('pcs', gameSlug, characterId, photoId, token, roles);
  }

  /**
   * Sets the roles of an NPC character photo (e.g. marking it as the profile photo).
   *
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string|number} photoId - Photo id to update.
   * @param {string|null} token - Authentication token, if any.
   * @param {string[]} roles - Roles to assign to the photo (e.g. `['profile']`).
   * @returns {Promise<Response>} fetch response from the photo set endpoint.
   */
  setNpcPhotoRoles(gameSlug, characterId, photoId, token, roles) {
    return this.#setPhotoRoles('npcs', gameSlug, characterId, photoId, token, roles);
  }

  /**
   * Sets the slain flag on an NPC character.
   *
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string|null} token - Authentication token, if any.
   * @param {boolean} slain - Desired slain state.
   * @returns {Promise<Response>} fetch response from the slain endpoint.
   */
  setNpcSlain(gameSlug, characterId, token, slain) {
    return this.request(`/games/${gameSlug}/npcs/${characterId}/slain.json`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      body: JSON.stringify({ slain }),
    });
  }

  #fetchCharacter(segment, gameSlug, characterId, token, suffix = null) {
    const base = `/games/${gameSlug}/${segment}/${characterId}`;
    const path = suffix ? `${base}/${suffix}.json` : `${base}.json`;

    return this.request(path, {
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

  #setPhotoRoles(segment, gameSlug, characterId, photoId, token, roles) {
    return this.request(`/games/${gameSlug}/${segment}/${characterId}/photos/${photoId}/set.json`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      body: JSON.stringify({ roles }),
    });
  }
}

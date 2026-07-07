import BaseClient from './BaseClient.js';

/**
 * HTTP client for PC and NPC character requests (fetch and update).
 *
 * @description Public methods shared by PCs and NPCs are parameterized by a
 *   `characterKind` argument (`'pcs'` or `'npcs'`), which is used both as the
 *   URL segment and to decide whether the (NPC-only) `X-Skip-Cache` header
 *   is required. NPC-only endpoints (`createNpc`, `fetchNpcsAll`,
 *   `setNpcSlain`) have no PC counterpart and stay unparameterized.
 */
export default class CharacterClient extends BaseClient {
  /**
   * Fetches the details of a character.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the character endpoint.
   */
  fetchCharacter(characterKind, gameSlug, characterId, token) {
    return this.#fetchCharacter(characterKind, gameSlug, characterId, token);
  }

  /**
   * Fetches the full details of a character (editor-only endpoint).
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the character full endpoint.
   */
  fetchCharacterFull(characterKind, gameSlug, characterId, token) {
    return this.#fetchCharacter(characterKind, gameSlug, characterId, token, 'full');
  }

  /**
   * Fetches the access permissions for a character.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the character access endpoint.
   */
  fetchCharacterAccess(characterKind, gameSlug, characterId, token) {
    return this.#fetchCharacter(characterKind, gameSlug, characterId, token, 'access');
  }

  /**
   * Fetches a page of the character's treasures.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the character treasures endpoint.
   */
  fetchCharacterTreasures(characterKind, gameSlug, characterId, token) {
    return this.#fetchCharacter(characterKind, gameSlug, characterId, token, 'treasures');
  }

  /**
   * Submits a partial update for a character.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} fields - Fields to update.
   * @returns {Promise<Response>} fetch response from the character endpoint.
   */
  updateCharacter(characterKind, gameSlug, characterId, token, fields) {
    return this.patchJson(`/games/${gameSlug}/${characterKind}/${characterId}.json`, token, fields);
  }

  /**
   * Fetches an explicit page of a character's treasures, used by the treasure
   * exchange modal's Sell tab (local pagination, independent of the URL).
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string|null} token - Authentication token, if any.
   * @param {{page: number, perPage: number}} [params] - Query params.
   * @returns {Promise<Response>} fetch response from the character treasures endpoint.
   */
  fetchTreasuresPage(characterKind, gameSlug, characterId, token, { page, perPage } = {}) {
    const search = new URLSearchParams();

    if (page) search.set('page', page);
    if (perPage) search.set('per_page', perPage);

    const query = search.toString();
    const base = `/games/${gameSlug}/${characterKind}/${characterId}/treasures.json`;
    const skipCache = characterKind === 'npcs' ? { 'X-Skip-Cache': 'true' } : {};

    return this.getJson(`${base}${query ? `?${query}` : ''}`, token, skipCache);
  }

  /**
   * Acquires a quantity of a treasure for a character, spending its money.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string|null} token - Authentication token, if any.
   * @param {{treasure_id: number, quantity: number}} fields - Acquire request fields.
   * @returns {Promise<Response>} fetch response from the acquire endpoint.
   */
  acquireTreasure(characterKind, gameSlug, characterId, token, fields) {
    return this.postJson(
      `/games/${gameSlug}/${characterKind}/${characterId}/treasures/acquire.json`, token, fields,
    );
  }

  /**
   * Sells a quantity of an owned treasure for a character, gaining money.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string|null} token - Authentication token, if any.
   * @param {{treasure_id: number, quantity: number}} fields - Sell request fields.
   * @returns {Promise<Response>} fetch response from the sell endpoint.
   */
  sellTreasure(characterKind, gameSlug, characterId, token, fields) {
    return this.postJson(
      `/games/${gameSlug}/${characterKind}/${characterId}/treasures/sell.json`, token, fields,
    );
  }

  /**
   * Sets the roles of a character photo (e.g. marking it as the profile photo).
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string|number} photoId - Photo id to update.
   * @param {string|null} token - Authentication token, if any.
   * @param {string[]} roles - Roles to assign to the photo (e.g. `['profile']`).
   * @returns {Promise<Response>} fetch response from the photo set endpoint.
   */
  setPhotoRoles(characterKind, gameSlug, characterId, photoId, token, roles) {
    return this.patchJson(
      `/games/${gameSlug}/${characterKind}/${characterId}/photos/${photoId}/set.json`, token, { roles },
    );
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
    return this.postJson(`/games/${gameSlug}/npcs.json`, token, fields);
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

    return this.getJson(path, token);
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
    return this.patchJson(`/games/${gameSlug}/npcs/${characterId}/slain.json`, token, { slain });
  }

  #fetchCharacter(characterKind, gameSlug, characterId, token, suffix = null) {
    const base = `/games/${gameSlug}/${characterKind}/${characterId}`;
    const path = suffix ? `${base}/${suffix}.json` : `${base}.json`;
    const skipCache = characterKind === 'npcs' && (suffix === null || suffix === 'treasures');

    return this.getJson(path, token, skipCache ? { 'X-Skip-Cache': 'true' } : {});
  }
}

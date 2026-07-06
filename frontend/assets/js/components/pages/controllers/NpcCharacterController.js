import CharacterController from './CharacterController.js';
import BasePageController from './BasePageController.js';

/**
 * Controller for NPC character detail page.
 */
export default class NpcCharacterController extends CharacterController {
  /**
   * Extract game slug and character id from an NPC character hash.
   *
   * @param {string} hash - Current hash.
   * @returns {object} Character route params.
   */
  static getNpcCharacterParamsFromHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/npcs/:character_id', hash, ['game_slug', 'character_id'],
    );
  }

  /**
   * Create an NPC character controller.
   *
   * @param {Function} setCharacter - Character setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {import('../../../client/GenericClient.js').default|null} client - Client override,
   *   used for hash resolution.
   * @param {Function} [paramsFromHash] - Hash param extractor override, used by
   *   subclasses/composed controllers whose route shape differs (e.g. the edit page).
   * @param {import('../../../client/CharacterClient.js').default|null} [characterClient] - Character
   *   client override.
   */
  constructor(
    setCharacter,
    setLoading,
    setError,
    client = null,
    paramsFromHash = NpcCharacterController.getNpcCharacterParamsFromHash,
    characterClient = null,
  ) {
    super(setCharacter, setLoading, setError, client, paramsFromHash, characterClient);
  }

  /**
   * Fetch the base NPC character data from the API.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} characterId - Character id.
   * @param {string|null} token - Authentication token.
   * @returns {Promise<Response>} Fetch response.
   */
  fetchCharacter(gameSlug, characterId, token) {
    return this.characterClient.fetchNpc(gameSlug, characterId, token);
  }

  /**
   * Fetch the full (editor-only) NPC character data from the API.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} characterId - Character id.
   * @param {string|null} token - Authentication token.
   * @returns {Promise<Response>} Fetch response.
   */
  fetchCharacterFull(gameSlug, characterId, token) {
    return this.characterClient.fetchNpcFull(gameSlug, characterId, token);
  }

  /**
   * Fetch the access permissions for the NPC character from the API.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} characterId - Character id.
   * @param {string|null} token - Authentication token.
   * @returns {Promise<Response>} Fetch response.
   */
  fetchCharacterAccess(gameSlug, characterId, token) {
    return this.characterClient.fetchNpcAccess(gameSlug, characterId, token);
  }

  /**
   * Fetch a first page of the NPC character's treasures from the API.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} characterId - Character id.
   * @param {string|null} token - Authentication token.
   * @returns {Promise<Response>} Fetch response.
   */
  fetchCharacterTreasures(gameSlug, characterId, token) {
    return this.characterClient.fetchNpcTreasures(gameSlug, characterId, token);
  }
}

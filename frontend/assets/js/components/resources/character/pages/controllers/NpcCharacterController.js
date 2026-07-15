import CharacterController from './CharacterController.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';

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
   * @param {import('../../../client/GameClient.js').default|null} [gameClient] - Game client override.
   */
  constructor(
    setCharacter,
    setLoading,
    setError,
    client = null,
    paramsFromHash = NpcCharacterController.getNpcCharacterParamsFromHash,
    characterClient = null,
    gameClient = null,
  ) {
    super(setCharacter, setLoading, setError, client, paramsFromHash, characterClient, 'npcs', gameClient);
  }
}

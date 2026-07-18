import CharacterController from './CharacterController.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for PC character detail page.
 */
export default class PcCharacterController extends CharacterController {
  /**
   * Extract game slug and character id from a PC character hash.
   *
   * @param {string} hash - Current hash.
   * @returns {object} Character route params.
   */
  static getPcCharacterParamsFromHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/pcs/:character_id', hash, ['game_slug', 'character_id'],
    );
  }

  /**
   * Create a PC character controller.
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
    paramsFromHash = PcCharacterController.getPcCharacterParamsFromHash,
    characterClient = null,
    gameClient = null,
  ) {
    super(setCharacter, setLoading, setError, client, paramsFromHash, characterClient, 'pcs', gameClient);
  }
}

import BaseCharacterTreasuresController from './BaseCharacterTreasuresController.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for the NPC character treasures index page.
 */
export default class NpcCharacterTreasuresController extends BaseCharacterTreasuresController {
  /**
   * Extract game slug and character id from the NPC character treasures hash route.
   *
   * @param {string} hash - Current hash.
   * @returns {object} Route params with game_slug and character_id.
   */
  static getNpcCharacterTreasuresParamsFromHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/npcs/:character_id/treasures', hash, ['game_slug', 'character_id'],
    );
  }

  /**
   * Create an NPC character treasures controller.
   *
   * @param {Function} setTreasures - Treasures setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {import('../../../client/GenericClient.js').default|null} [client] - Client override.
   * @param {Function} [setCharacter] - Character context setter, used for the "Add treasure"
   *   button's visibility and the exchange modal's affordability checks.
   * @param {import('../../../client/CharacterClient.js').default|null} [characterClient] - Character client override.
   * @param {import('../../../client/GameClient.js').default|null} [gameClient] - Game client override.
   */
  constructor(
    setTreasures,
    setPagination,
    setLoading,
    setError,
    client = null,
    setCharacter = Noop.noop,
    characterClient = null,
    gameClient = null,
  ) {
    super(
      { setTreasures, setPagination, setLoading, setError, setCharacter },
      NpcCharacterTreasuresController.getNpcCharacterTreasuresParamsFromHash,
      'npcs',
      client,
      characterClient,
      gameClient,
    );
  }
}

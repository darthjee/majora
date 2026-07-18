import BaseCharacterPhotosController from './BaseCharacterPhotosController.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';

/**
 * Controller for the NPC character photos index page.
 */
export default class NpcCharacterPhotosController extends BaseCharacterPhotosController {
  /**
   * Extract game slug and character id from the NPC character photos hash route.
   *
   * @param {string} hash - Current hash.
   * @returns {object} Route params with game_slug and character_id.
   */
  static getNpcCharacterPhotosParamsFromHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/npcs/:character_id/photos', hash, ['game_slug', 'character_id'],
    );
  }

  /**
   * Create an NPC character photos controller.
   *
   * @param {Function} setPhotos - Photos setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setCharacter - Character setter, merged with can_edit for the upload button gate.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {import('../../../client/GenericClient.js').default|null} [client] - Client override.
   * @param {import('../../../client/CharacterClient.js').default|null} [characterClient] - Character client override.
   */
  constructor(setPhotos, setPagination, setCharacter, setLoading, setError, client = null, characterClient = null) {
    super(
      { setPhotos, setPagination, setCharacter, setLoading, setError },
      NpcCharacterPhotosController.getNpcCharacterPhotosParamsFromHash,
      'npcs',
      client,
      characterClient,
    );
  }
}

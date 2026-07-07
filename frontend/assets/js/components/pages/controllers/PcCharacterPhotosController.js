import BaseCharacterPhotosController from './BaseCharacterPhotosController.js';
import BasePageController from './BasePageController.js';

/**
 * Controller for the PC character photos index page.
 */
export default class PcCharacterPhotosController extends BaseCharacterPhotosController {
  /**
   * Extract game slug and character id from the PC character photos hash route.
   *
   * @param {string} hash - Current hash.
   * @returns {object} Route params with game_slug and character_id.
   */
  static getPcCharacterPhotosParamsFromHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/pcs/:character_id/photos', hash, ['game_slug', 'character_id'],
    );
  }

  /**
   * Create a PC character photos controller.
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
      setPhotos,
      setPagination,
      setCharacter,
      setLoading,
      setError,
      PcCharacterPhotosController.getPcCharacterPhotosParamsFromHash,
      'pcs',
      client,
      characterClient,
    );
  }
}

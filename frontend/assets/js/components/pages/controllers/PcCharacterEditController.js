import PcCharacterController from './PcCharacterController.js';
import BaseCharacterEditController from './BaseCharacterEditController.js';
import BasePageController from './BasePageController.js';
import Noop from '../../../utils/Noop.js';

/**
 * Controller for the PC character edit page.
 */
export default class PcCharacterEditController extends BaseCharacterEditController {
  /**
   * Extract game slug and character id from a PC character edit hash.
   *
   * @param {string} hash - Current hash.
   * @returns {object} Character route params.
   */
  static getPcCharacterEditParamsFromHash(hash = '') {
    return BasePageController.extractParams(
      '/games/:game_slug/pcs/:character_id/edit', hash, ['game_slug', 'character_id'],
    );
  }

  /**
   * Create a PC character edit controller.
   *
   * @param {Function} setCharacter - Character setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {import('../../../client/GenericClient.js').default|null} [client] - Client override,
   *   used for hash resolution.
   * @param {import('../../../client/CharacterClient.js').default|null} [characterClient] - Character client override.
   */
  constructor(
    setCharacter,
    setLoading,
    setError,
    setFieldErrors = Noop.noop,
    client = null,
    characterClient = null,
  ) {
    super(
      setCharacter,
      setLoading,
      setError,
      setFieldErrors,
      PcCharacterController,
      PcCharacterEditController.getPcCharacterEditParamsFromHash,
      'pcs',
      'updatePc',
      client,
      characterClient,
    );
  }
}

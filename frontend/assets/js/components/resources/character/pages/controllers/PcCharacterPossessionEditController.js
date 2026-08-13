import BaseCharacterPossessionEditController from './BaseCharacterPossessionEditController.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for the PC possession edit page (issue #1076).
 */
export default class PcCharacterPossessionEditController extends BaseCharacterPossessionEditController {
  /**
   * Extract the game slug, character id, and possession id from a PC possession edit hash.
   *
   * @param {string} hash - Current hash.
   * @returns {{game_slug: string, character_id: string, id: string}} Route params.
   */
  static getParamsFromHash(hash = '') {
    return BaseCharacterPossessionEditController.getParamsFromHash('pcs', hash);
  }

  /**
   * Create a PC possession edit controller.
   *
   * @param {Function} setPossession - Possession setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {import('../../../../../client/GenericClient.js').default|null} [client] - Client override,
   *   mainly for tests.
   */
  constructor(setPossession, setLoading, setError, setFieldErrors = Noop.noop, client = null) {
    super('pcs', setPossession, setLoading, setError, setFieldErrors, client);
  }
}

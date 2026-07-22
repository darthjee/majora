import BaseCharacterItemEditController from './BaseCharacterItemEditController.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for the PC item edit page (issue #766).
 */
export default class PcCharacterItemEditController extends BaseCharacterItemEditController {
  /**
   * Extract the game slug, character id, and item id from a PC item edit hash.
   *
   * @param {string} hash - Current hash.
   * @returns {{game_slug: string, character_id: string, id: string}} Route params.
   */
  static getParamsFromHash(hash = '') {
    return BaseCharacterItemEditController.getParamsFromHash('pcs', hash);
  }

  /**
   * Create a PC item edit controller.
   *
   * @param {Function} setItem - Item setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {import('../../../../../client/GenericClient.js').default|null} [client] - Client override,
   *   mainly for tests.
   */
  constructor(setItem, setLoading, setError, setFieldErrors = Noop.noop, client = null) {
    super('pcs', setItem, setLoading, setError, setFieldErrors, client);
  }
}

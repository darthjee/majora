import BaseCharacterItemEditController from './BaseCharacterItemEditController.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for the NPC item edit page (issue #766).
 */
export default class NpcCharacterItemEditController extends BaseCharacterItemEditController {
  /**
   * Extract the game slug, character id, and item id from an NPC item edit hash.
   *
   * @param {string} hash - Current hash.
   * @returns {{game_slug: string, character_id: string, id: string}} Route params.
   */
  static getParamsFromHash(hash = '') {
    return BaseCharacterItemEditController.getParamsFromHash('npcs', hash);
  }

  /**
   * Create an NPC item edit controller.
   *
   * @param {Function} setItem - Item setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {import('../../../../../client/GenericClient.js').default|null} [client] - Client override,
   *   mainly for tests.
   */
  constructor(setItem, setLoading, setError, setFieldErrors = Noop.noop, client = null) {
    super('npcs', setItem, setLoading, setError, setFieldErrors, client);
  }
}

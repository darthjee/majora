import PcCharacterController from './PcCharacterController.js';
import BaseCharacterEditController, { resolveLoadedCharacter }
  from './BaseCharacterEditController.js';
import Router from '../../../utils/Router.js';

/**
 * Extract game slug and character id from a PC character edit hash.
 *
 * @param {string} hash - Current hash.
 * @returns {object} Character route params.
 */
export function getPcCharacterEditParamsFromHash(hash = '') {
  const params = Router.extractParams('/games/:game_slug/pcs/:character_id/edit', hash);

  return {
    game_slug: params.game_slug ?? '',
    character_id: params.character_id ?? '',
  };
}

export { resolveLoadedCharacter };

/**
 * Controller for the PC character edit page.
 */
export default class PcCharacterEditController extends BaseCharacterEditController {
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
    setFieldErrors = () => {},
    client = null,
    characterClient = null,
  ) {
    super(
      setCharacter,
      setLoading,
      setError,
      setFieldErrors,
      PcCharacterController,
      getPcCharacterEditParamsFromHash,
      'pcs',
      'updatePc',
      client,
      characterClient,
    );
  }
}

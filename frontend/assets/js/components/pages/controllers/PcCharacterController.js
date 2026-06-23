import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';
import AuthStorage from '../../../utils/AuthStorage.js';

/**
 * Extract game slug and character id from a PC character hash.
 *
 * @param {string} hash - Current hash.
 * @returns {object} Character route params.
 */
export function getPcCharacterParamsFromHash(hash = '') {
  const params = Router.extractParams('/games/:game_slug/pcs/:character_id', hash);

  return {
    game_slug: params.game_slug ?? '',
    character_id: params.character_id ?? '',
  };
}

/**
 * Controller for PC character detail page.
 */
export default class PcCharacterController extends BasePageController {
  /**
   * Create a PC character controller.
   *
   * @param {Function} setCharacter - Character setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override.
   * @param {Function} [paramsFromHash] - Hash param extractor override, used by
   *   subclasses/composed controllers whose route shape differs (e.g. the edit page).
   */
  constructor(
    setCharacter,
    setLoading,
    setError,
    client = null,
    paramsFromHash = getPcCharacterParamsFromHash,
  ) {
    super();
    this.setCharacter = setCharacter;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
    this.paramsFromHash = paramsFromHash;
  }

  /**
   * Build page loading effect.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const params = this.paramsFromHash(this.client.currentHash());

      if (!params.game_slug || !params.character_id) {
        safeSet(this.setError, 'Unable to load character.');
        safeSet(this.setLoading, false);
      } else {
        const token = AuthStorage.getToken();

        this.client.request(`/games/${params.game_slug}/pcs/${params.character_id}.json`, {
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Token ${token}` } : {}),
          },
        })
          .then((response) => {
            if (!response.ok) throw new Error('Unable to load character.');
            return response.json();
          })
          .then((character) => safeSet(this.setCharacter, character))
          .catch(() => safeSet(this.setError, 'Unable to load character.'))
          .finally(() => safeSet(this.setLoading, false));
      }

      return () => {
        mounted = false;
      };
    };
  }
}

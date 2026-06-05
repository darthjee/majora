import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';

/**
 * Extract game slug and character id from hash.
 *
 * @param {string} hash - Current hash.
 * @returns {object} Character route params.
 */
export function getCharacterParamsFromHash(hash = '') {
  const params = Router.extractParams('/games/:game_slug/characters/:character_id', hash);

  return {
    game_slug: params.game_slug ?? '',
    character_id: params.character_id ?? '',
  };
}

/**
 * Controller for character detail page.
 */
export default class CharacterController extends BasePageController {
  /**
   * Create a character controller.
   *
   * @param {Function} setCharacter - Character setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override.
   */
  constructor(setCharacter, setLoading, setError, client = null) {
    super();
    this.setCharacter = setCharacter;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
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
      const params = getCharacterParamsFromHash(this.client.currentHash());

      if (!params.game_slug || !params.character_id) {
        safeSet(this.setError, 'Unable to load character.');
        safeSet(this.setLoading, false);
      } else {
        this.client.fetch(`/games/${params.game_slug}/characters/${params.character_id}.json`)
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

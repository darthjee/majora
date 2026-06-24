import CharacterClient from '../../../client/CharacterClient.js';
import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';
import AuthStorage from '../../../utils/AuthStorage.js';

/**
 * Extract game slug and character id from an NPC character full hash.
 *
 * @param {string} hash - Current hash.
 * @returns {object} Character route params.
 */
export function getNpcCharacterFullParamsFromHash(hash = '') {
  const params = Router.extractParams('/games/:game_slug/npcs/:character_id/full', hash);

  return {
    game_slug: params.game_slug ?? '',
    character_id: params.character_id ?? '',
  };
}

/**
 * Controller for the NPC character full detail page.
 */
export default class NpcCharacterFullController extends BasePageController {
  /**
   * Create an NPC character full controller.
   *
   * @param {Function} setCharacter - Character setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override, used for hash resolution.
   * @param {CharacterClient|null} [characterClient] - Character client override.
   */
  constructor(
    setCharacter,
    setLoading,
    setError,
    client = null,
    characterClient = null,
  ) {
    super();
    this.setCharacter = setCharacter;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
    this.characterClient = characterClient ?? new CharacterClient();
  }

  /**
   * Build page loading effect; redirects to the regular detail page on 403.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const params = getNpcCharacterFullParamsFromHash(this.client.currentHash());

      if (!params.game_slug || !params.character_id) {
        safeSet(this.setError, 'Unable to load character.');
        safeSet(this.setLoading, false);
      } else {
        const token = AuthStorage.getToken();

        this.characterClient.fetchNpcFull(params.game_slug, params.character_id, token)
          .then((response) => {
            if (response.status === 403) {
              NpcCharacterFullController.#redirectToDetail(params.game_slug, params.character_id);
              return null;
            }
            if (!response.ok) throw new Error('Unable to load character.');
            return response.json();
          })
          .then((character) => {
            if (character !== null) {
              safeSet(this.setCharacter, character);
            }
          })
          .catch(() => safeSet(this.setError, 'Unable to load character.'))
          .finally(() => safeSet(this.setLoading, false));
      }

      return () => {
        mounted = false;
      };
    };
  }

  static #redirectToDetail(gameSlug, characterId) {
    if (typeof window === 'undefined') {
      return;
    }

    window.location.hash = `/games/${gameSlug}/npcs/${characterId}`;
  }
}

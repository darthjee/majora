import CharacterClient from '../../../client/CharacterClient.js';
import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';
import Router from '../../../utils/Router.js';
import AuthStorage from '../../../utils/AuthStorage.js';

/**
 * Extract game slug and character id from an NPC character hash.
 *
 * @param {string} hash - Current hash.
 * @returns {object} Character route params.
 */
export function getNpcCharacterParamsFromHash(hash = '') {
  const params = Router.extractParams('/games/:game_slug/npcs/:character_id', hash);

  return {
    game_slug: params.game_slug ?? '',
    character_id: params.character_id ?? '',
  };
}

/**
 * Controller for NPC character detail page.
 */
export default class NpcCharacterController extends BasePageController {
  /**
   * Create an NPC character controller.
   *
   * @param {Function} setCharacter - Character setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override, used for hash resolution.
   * @param {Function} [paramsFromHash] - Hash param extractor override, used by
   *   subclasses/composed controllers whose route shape differs (e.g. the edit page).
   * @param {CharacterClient|null} [characterClient] - Character client override.
   */
  constructor(
    setCharacter,
    setLoading,
    setError,
    client = null,
    paramsFromHash = getNpcCharacterParamsFromHash,
    characterClient = null,
  ) {
    super();
    this.setCharacter = setCharacter;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
    this.paramsFromHash = paramsFromHash;
    this.characterClient = characterClient ?? new CharacterClient();
  }

  /**
   * Handle the full character response, merging the private description
   * into the base character when available.
   *
   * @param {Response} fullResponse - Response from fetchNpcFull.
   * @param {object} character - Base character data already loaded.
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @returns {Promise<void>} Resolves once the character state is updated.
   */
  handleFullResponse(fullResponse, character, safeSet) {
    if (fullResponse.ok) {
      return this.mergePrivateDescription(fullResponse, character, safeSet);
    }
    safeSet(this.setCharacter, character);
  }

  /**
   * Merge the private description from the full response into the
   * base character and update the character state.
   *
   * @param {Response} fullResponse - Response from fetchNpcFull.
   * @param {object} character - Base character data already loaded.
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @returns {Promise<void>} Resolves once the character state is updated.
   */
  mergePrivateDescription(fullResponse, character, safeSet) {
    return fullResponse.json().then((full) => {
      safeSet(this.setCharacter, { ...character, private_description: full.private_description });
    });
  }

  /**
   * Load the full character detail when the current user can edit it,
   * merging the private description into the character state.
   *
   * @param {object} character - Base character data already loaded.
   * @param {object} params - Route params with game_slug and character_id.
   * @param {string|null} token - Authentication token.
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @returns {Promise<void>|undefined} Resolves once the character state is updated.
   */
  loadFullCharacter(character, params, token, safeSet) {
    if (!character.can_edit) {
      safeSet(this.setCharacter, character);
      return undefined;
    }
    return this.characterClient.fetchNpcFull(params.game_slug, params.character_id, token)
      .then((fullResponse) => this.handleFullResponse(fullResponse, character, safeSet))
      .catch(() => safeSet(this.setCharacter, character));
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

        this.characterClient.fetchNpc(params.game_slug, params.character_id, token)
          .then((response) => {
            if (!response.ok) throw new Error('Unable to load character.');
            return response.json();
          })
          .then((character) => this.loadFullCharacter(character, params, token, safeSet))
          .catch(() => safeSet(this.setError, 'Unable to load character.'))
          .finally(() => safeSet(this.setLoading, false));
      }

      return () => {
        mounted = false;
      };
    };
  }
}

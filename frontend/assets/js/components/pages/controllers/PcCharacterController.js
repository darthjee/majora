import CharacterClient from '../../../client/CharacterClient.js';
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
    paramsFromHash = getPcCharacterParamsFromHash,
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
   * Handle the access endpoint response, overlaying can_edit onto the character.
   * Falls back to the original character when the response is not ok.
   *
   * @param {Response} accessResponse - Response from fetchPcAccess.
   * @param {object} character - Base character data already loaded.
   * @returns {Promise<object>} Resolves to the character with can_edit applied.
   */
  handleAccessResponse(accessResponse, character) {
    if (!accessResponse.ok) return Promise.resolve(character);
    return accessResponse.json().then((access) => ({ ...character, can_edit: access.can_edit }));
  }

  /**
   * Handle the full character response, merging the private description
   * into the base character when available.
   *
   * @param {Response} fullResponse - Response from fetchPcFull.
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
   * @param {Response} fullResponse - Response from fetchPcFull.
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
    return this.characterClient.fetchPcFull(params.game_slug, params.character_id, token)
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

        this.characterClient.fetchPc(params.game_slug, params.character_id, token)
          .then((response) => {
            if (!response.ok) throw new Error('Unable to load character.');
            return response.json();
          })
          .then((character) => {
            return this.characterClient.fetchPcAccess(params.game_slug, params.character_id, token)
              .then((accessResponse) => this.handleAccessResponse(accessResponse, character))
              .catch(() => character)
              .then((characterWithAccess) => this.loadFullCharacter(characterWithAccess, params, token, safeSet));
          })
          .catch(() => safeSet(this.setError, 'Unable to load character.'))
          .finally(() => safeSet(this.setLoading, false));
      }

      return () => {
        mounted = false;
      };
    };
  }
}

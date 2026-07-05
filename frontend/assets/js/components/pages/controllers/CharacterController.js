import CharacterClient from '../../../client/CharacterClient.js';
import GenericClient from '../../../client/GenericClient.js';
import BasePageController from './BasePageController.js';
import AuthStorage from '../../../utils/AuthStorage.js';

/**
 * Base controller for character detail pages (PC and NPC).
 *
 * Subclasses must implement {@link CharacterController#fetchCharacter},
 * {@link CharacterController#fetchCharacterFull}, and
 * {@link CharacterController#fetchCharacterAccess} to delegate to the
 * appropriate {@link CharacterClient} methods for their character type.
 */
export default class CharacterController extends BasePageController {
  /**
   * Create a character controller.
   *
   * @param {Function} setCharacter - Character setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override, used for hash resolution.
   * @param {Function} paramsFromHash - Hash param extractor; concrete subclasses
   *   provide a default via their own constructor default argument.
   * @param {CharacterClient|null} [characterClient] - Character client override.
   */
  constructor(
    setCharacter,
    setLoading,
    setError,
    client = null,
    paramsFromHash,
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
   * Fetch the base character data from the API.
   * Must be implemented by subclasses.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} characterId - Character id.
   * @param {string|null} token - Authentication token.
   * @returns {Promise<Response>} Fetch response.
   */
  fetchCharacter(gameSlug, characterId, token) { // eslint-disable-line no-unused-vars
    throw new Error('CharacterController#fetchCharacter must be implemented by subclass');
  }

  /**
   * Fetch the full (editor-only) character data from the API.
   * Must be implemented by subclasses.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} characterId - Character id.
   * @param {string|null} token - Authentication token.
   * @returns {Promise<Response>} Fetch response.
   */
  fetchCharacterFull(gameSlug, characterId, token) { // eslint-disable-line no-unused-vars
    throw new Error('CharacterController#fetchCharacterFull must be implemented by subclass');
  }

  /**
   * Fetch the access permissions for the character from the API.
   * Must be implemented by subclasses.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} characterId - Character id.
   * @param {string|null} token - Authentication token.
   * @returns {Promise<Response>} Fetch response.
   */
  fetchCharacterAccess(gameSlug, characterId, token) { // eslint-disable-line no-unused-vars
    throw new Error('CharacterController#fetchCharacterAccess must be implemented by subclass');
  }

  /**
   * Fetch a first page of the character's treasures from the API.
   * Must be implemented by subclasses.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} characterId - Character id.
   * @param {string|null} token - Authentication token.
   * @returns {Promise<Response>} Fetch response.
   */
  fetchCharacterTreasures(gameSlug, characterId, token) { // eslint-disable-line no-unused-vars
    throw new Error('CharacterController#fetchCharacterTreasures must be implemented by subclass');
  }

  /**
   * Handle the access endpoint response, overlaying can_edit onto the character.
   * Falls back to the original character when the response is not ok.
   *
   * @param {Response} accessResponse - Response from fetchCharacterAccess.
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
   * @param {Response} fullResponse - Response from fetchCharacterFull.
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
   * @param {Response} fullResponse - Response from fetchCharacterFull.
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
   * Fetch the access endpoint and merge the result into the character,
   * then load the full character detail if editing is permitted.
   *
   * @param {object} character - Base character data already loaded.
   * @param {object} params - Route params with game_slug and character_id.
   * @param {string|null} token - Authentication token.
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @returns {Promise<void>} Resolves once the character state is updated.
   */
  fetchAndMergeAccess(character, params, token, safeSet) {
    return this.fetchCharacterAccess(params.game_slug, params.character_id, token)
      .then((accessResponse) => this.handleAccessResponse(accessResponse, character))
      .catch(() => character)
      .then((characterWithAccess) => this.loadFullCharacter(characterWithAccess, params, token, safeSet));
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
    return this.fetchCharacterFull(params.game_slug, params.character_id, token)
      .then((fullResponse) => this.handleFullResponse(fullResponse, character, safeSet))
      .catch(() => safeSet(this.setCharacter, character));
  }

  /**
   * Parse the character fetch response, throwing on non-ok status.
   *
   * @param {Response} response - Fetch response from fetchCharacter.
   * @returns {Promise<object>} Parsed character JSON.
   */
  handleCharacterResponse(response) {
    if (!response.ok) throw new Error('Unable to load character.');
    return response.json();
  }

  /**
   * Fetch the character's treasures and merge them onto the character as
   * `character.treasures`. Treasures are supplementary, not essential, so any
   * failure (network error or non-ok response) degrades to an empty array
   * rather than failing the whole character page load.
   *
   * @param {object} character - Base character data already loaded.
   * @param {object} params - Route params with game_slug and character_id.
   * @param {string|null} token - Authentication token.
   * @returns {Promise<object>} Resolves to the character with treasures applied.
   */
  fetchAndMergeTreasures(character, params, token) {
    return this.fetchCharacterTreasures(params.game_slug, params.character_id, token)
      .then((response) => (response.ok ? response.json() : []))
      .then((treasures) => ({ ...character, treasures: Array.isArray(treasures) ? treasures : [] }))
      .catch(() => ({ ...character, treasures: [] }));
  }

  /**
   * Load the character using the stored token, parse the response,
   * merge treasures and access permissions, and update loading state.
   *
   * @param {object} params - Route params with game_slug and character_id.
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @returns {Promise<void>} Resolves once the character state is updated.
   */
  loadCharacter(params, safeSet) {
    const token = AuthStorage.getToken();

    return this.fetchCharacter(params.game_slug, params.character_id, token)
      .then((response) => this.handleCharacterResponse(response))
      .then((character) => this.fetchAndMergeTreasures(character, params, token))
      .then((character) => this.fetchAndMergeAccess(character, params, token, safeSet))
      .catch(() => safeSet(this.setError, 'Unable to load character.'))
      .finally(() => safeSet(this.setLoading, false));
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
        this.loadCharacter(params, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }
}

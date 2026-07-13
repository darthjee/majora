import CharacterClient from '../../../../../client/CharacterClient.js';
import GenericClient from '../../../../../client/GenericClient.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';
import AuthStorage from '../../../../../utils/AuthStorage.js';
import AccessStore from '../../../../../utils/AccessStore.js';

/**
 * Base controller for character detail pages (PC and NPC).
 *
 * @description Parameterized by `characterKind` (`'pcs'` or `'npcs'`), so a
 *   single implementation covers both PC and NPC detail pages by delegating
 *   to {@link CharacterClient}'s parameterized methods.
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
   * @param {string} [characterKind] - Character kind (`'pcs'` or `'npcs'`), used to
   *   build the correct URL segment for every character client call.
   */
  constructor(
    setCharacter,
    setLoading,
    setError,
    client = null,
    paramsFromHash,
    characterClient = null,
    characterKind = 'pcs',
  ) {
    super();
    this.setCharacter = setCharacter;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
    this.paramsFromHash = paramsFromHash;
    this.characterClient = characterClient ?? new CharacterClient();
    this.characterKind = characterKind;
  }

  /**
   * Fetch the base character data from the API.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} characterId - Character id.
   * @param {string|null} token - Authentication token.
   * @returns {Promise<Response>} Fetch response.
   */
  fetchCharacter(gameSlug, characterId, token) {
    return this.characterClient.fetchCharacter(this.characterKind, gameSlug, characterId, token);
  }

  /**
   * Fetch the full (editor-only) character data from the API.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} characterId - Character id.
   * @param {string|null} token - Authentication token.
   * @returns {Promise<Response>} Fetch response.
   */
  fetchCharacterFull(gameSlug, characterId, token) {
    return this.characterClient.fetchCharacterFull(this.characterKind, gameSlug, characterId, token);
  }

  /**
   * Fetch a first page of the character's treasures from the API.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} characterId - Character id.
   * @param {string|null} token - Authentication token.
   * @returns {Promise<Response>} Fetch response.
   */
  fetchCharacterTreasures(gameSlug, characterId, token) {
    return this.characterClient.fetchCharacterTreasures(this.characterKind, gameSlug, characterId, token);
  }

  /**
   * Handle the full character response, merging every field of the
   * authoritative full (DM-only) character data into the base character
   * when available.
   *
   * @param {Response} fullResponse - Response from fetchCharacterFull.
   * @param {object} character - Base character data already loaded.
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @returns {Promise<void>} Resolves once the character state is updated.
   */
  handleFullResponse(fullResponse, character, safeSet) {
    if (fullResponse.ok) {
      return this.mergeFullCharacter(fullResponse, character, safeSet);
    }
    safeSet(this.setCharacter, character);
  }

  /**
   * Merge every field from the full (DM-only) character response onto the
   * base character and update the character state. The full response is
   * authoritative for fields it exposes (e.g. `slain`, `public_slain`,
   * `allegiance`, `public_allegiance`, `private_description`), overriding
   * whatever the public serializer provided for those same fields.
   *
   * @param {Response} fullResponse - Response from fetchCharacterFull.
   * @param {object} character - Base character data already loaded.
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @returns {Promise<void>} Resolves once the character state is updated.
   */
  mergeFullCharacter(fullResponse, character, safeSet) {
    return fullResponse.json().then((full) => {
      safeSet(this.setCharacter, { ...character, ...full });
    });
  }

  /**
   * Resolve the character's access identity and edit permissions right away
   * through {@link AccessStore}'s synchronous, fail-closed readers, merge
   * them into the character, and load the full character detail if editing
   * is permitted. Also starts the real access/permissions fetches in the
   * background and re-runs this same merge-and-load pass once they resolve,
   * so the page picks up the real values (and, if `can_edit` newly resolves
   * `true`, the deferred full-character fetch) without blocking the first
   * render.
   *
   * @param {object} character - Base character data already loaded.
   * @param {object} params - Route params with game_slug and character_id.
   * @param {string|null} token - Authentication token.
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @returns {Promise<void>|undefined} Resolves once the character state is updated.
   */
  fetchAndMergeAccess(character, params, token, safeSet) {
    const firstPass = this.#loadCharacterAccess(character, params, token, safeSet);

    Promise.all([
      AccessStore.ensureCharacterAccess(this.characterKind, params.game_slug, params.character_id),
      AccessStore.ensureCharacterPermissions(this.characterKind, params.game_slug, params.character_id),
    ]).then(() => this.#loadCharacterAccess(character, params, token, safeSet));

    return firstPass;
  }

  #loadCharacterAccess(character, params, token, safeSet) {
    const characterWithAccess = this.#mergeAccess(character, params);

    return this.loadFullCharacter(characterWithAccess, params, token, safeSet);
  }

  #mergeAccess(character, params) {
    const access = AccessStore.getCharacterAccess(
      this.characterKind, params.game_slug, params.character_id,
    );
    const permissions = AccessStore.getCharacterPermissions(
      this.characterKind, params.game_slug, params.character_id,
    );

    return { ...character, can_edit: permissions.can_edit, is_player: access.is_player };
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

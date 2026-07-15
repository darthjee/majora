import CharacterClient from '../../../../../client/CharacterClient.js';
import GenericClient from '../../../../../client/GenericClient.js';
import GameClient from '../../../../../client/GameClient.js';
import BasePageController from '../../../../common/controllers/BasePageController.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import CharacterGameTypeResolver from './CharacterGameTypeResolver.js';

/**
 * Base controller for character detail pages (PC and NPC).
 *
 * @description Parameterized by `characterKind` (`'pcs'` or `'npcs'`) so a single
 *   implementation covers both, delegating to {@link CharacterClient}'s parameterized methods.
 */
export default class CharacterController extends BasePageController {
  /**
   * Create a character controller.
   *
   * @param {Function} setCharacter - Character setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} client - Client override, used for hash resolution.
   * @param {Function} paramsFromHash - Hash param extractor; subclasses default this.
   * @param {CharacterClient|null} [characterClient] - Character client override.
   * @param {string} [characterKind] - Character kind (`'pcs'` or `'npcs'`), used as the URL segment.
   * @param {GameClient|null} [gameClient] - Game client override, used for the game currency type.
   */
  constructor(
    setCharacter,
    setLoading,
    setError,
    client = null,
    paramsFromHash,
    characterClient = null,
    characterKind = 'pcs',
    gameClient = null,
  ) {
    super();
    this.setCharacter = setCharacter;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
    this.paramsFromHash = paramsFromHash;
    this.characterClient = characterClient ?? new CharacterClient();
    this.characterKind = characterKind;
    this.gameClient = gameClient ?? new GameClient();
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
   * Fetch a first page of the character's photos from the API.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} characterId - Character id.
   * @param {string|null} token - Authentication token.
   * @returns {Promise<Response>} Fetch response.
   */
  fetchCharacterPhotos(gameSlug, characterId, token) {
    return this.characterClient.fetchCharacterPhotos(this.characterKind, gameSlug, characterId, token);
  }

  /**
   * Handle the full character response, merging in the full (DM-only) character data when available.
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
   * Merge every field from the full (DM-only) character response onto the base character
   * (e.g. `slain`, `public_slain`, `allegiance`, `private_description`), overriding
   * whatever the public serializer provided, and update the character state.
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
   * Resolve access via {@link AccessStore}'s fail-closed readers, merge it into the character, and
   * load full detail if editing is permitted; re-runs the same pass once the real access/permissions
   * fetches resolve, marking `access_resolved` `true` (vs. a not-yet-known fail-closed pass).
   *
   * @param {object} character - Base character data already loaded.
   * @param {object} params - Route params with game_slug and character_id.
   * @param {string|null} token - Authentication token.
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @returns {Promise<void>|undefined} Resolves once the character state is updated.
   */
  fetchAndMergeAccess(character, params, token, safeSet) {
    const firstPass = this.#loadCharacterAccess(character, params, token, safeSet, false);

    Promise.all([
      AccessStore.ensureCharacterAccess(this.characterKind, params.game_slug, params.character_id),
      AccessStore.ensureCharacterPermissions(this.characterKind, params.game_slug, params.character_id),
    ]).then(() => this.#loadCharacterAccess(character, params, token, safeSet, true));

    return firstPass;
  }

  #loadCharacterAccess(character, params, token, safeSet, resolved) {
    const characterWithAccess = this.#mergeAccess(character, params, resolved);

    return this.loadFullCharacter(characterWithAccess, params, token, safeSet);
  }

  #mergeAccess(character, params, resolved) {
    const access = AccessStore.getCharacterAccess(
      this.characterKind, params.game_slug, params.character_id,
    );
    const permissions = AccessStore.getCharacterPermissions(
      this.characterKind, params.game_slug, params.character_id,
    );

    return {
      ...character,
      can_edit: permissions.can_edit,
      is_player: access.is_player,
      access_resolved: resolved,
    };
  }

  /**
   * Load the full character detail when the current user can edit it.
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
   * Fetch the character's treasures and merge them onto the character as `character.treasures`,
   * degrading to an empty array on failure rather than failing the whole page load.
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
   * Fetch the character's photos and merge them onto the character as `character.photos`,
   * degrading to an empty array on failure rather than failing the whole page load.
   *
   * @param {object} character - Base character data already loaded.
   * @param {object} params - Route params with game_slug and character_id.
   * @param {string|null} token - Authentication token.
   * @returns {Promise<object>} Resolves to the character with photos applied.
   */
  fetchAndMergePhotos(character, params, token) {
    return this.fetchCharacterPhotos(params.game_slug, params.character_id, token)
      .then((response) => (response.ok ? response.json() : []))
      .then((photos) => ({ ...character, photos: Array.isArray(photos) ? photos : [] }))
      .catch(() => ({ ...character, photos: [] }));
  }

  /**
   * Fetch the character's own game.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token.
   * @returns {Promise<Response>} Fetch response.
   */
  fetchGame(gameSlug, token) {
    return this.gameClient.fetchGame(gameSlug, token);
  }

  /**
   * Fetch and merge the character's own game `game_type`. See {@link CharacterGameTypeResolver}.
   *
   * @param {object} character - Base character data already loaded.
   * @param {object} params - Route params with game_slug and character_id.
   * @param {string|null} token - Authentication token.
   * @returns {Promise<object>} Resolves to the character with game_type applied.
   */
  fetchAndMergeGameType(character, params, token) {
    return CharacterGameTypeResolver.merge(character, this.fetchGame(params.game_slug, token));
  }

  /**
   * Load the character, merge treasures/photos/game_type/access, and update loading state.
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
      .then((character) => this.fetchAndMergePhotos(character, params, token))
      .then((character) => this.fetchAndMergeGameType(character, params, token))
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

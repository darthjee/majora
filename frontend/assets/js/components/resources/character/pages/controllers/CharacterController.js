import GenericClient from '../../../../../client/GenericClient.js';
import GameClient from '../../../../../client/GameClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import CharacterGameTypeResolver from './CharacterGameTypeResolver.js';
import CharacterAccessResolver from './CharacterAccessResolver.js';
import CharacterListsController from './CharacterListsController.js';

/**
 * Base controller for character detail pages (PC and NPC).
 *
 * @description Parameterized by `characterKind` (`'pcs'` or `'npcs'`) so a single
 *   implementation covers both, delegating to {@link CharacterClient}'s parameterized methods.
 *   Extends {@link CharacterListsController} (treasures/items/documents/photos fetch+merge) to
 *   keep both files under the project's per-file line limit.
 *
 *   The base character fetch goes through `RequestStore.ensure({resource: 'pc'|'npc',
 *   quantityType: 'single', params: {gameSlug, id: characterId}})`, which resolves the
 *   requester's character-level edit permission (via `RequestPermissionResolvers`) *before*
 *   fetching, then picks the right variant (`.../full.json` on `can_edit`, the player-facing
 *   endpoint otherwise) in one call — collapsing what used to be a separate
 *   `fetchCharacterFull`/`handleFullResponse`/`mergeFullCharacter`/`loadFullCharacter` chain of
 *   its own. `fetchAndMergeAccess` still independently resolves and merges `is_player`/`is_staff`/
 *   `can_edit` onto the character in two passes (fail-closed, then real) for rendering purposes —
 *   unrelated to which endpoint variant `RequestStore` already picked to fetch the character body.
 */
export default class CharacterController extends CharacterListsController {
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
    super(characterClient, characterKind);
    this.setCharacter = setCharacter;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
    this.paramsFromHash = paramsFromHash;
    this.gameClient = gameClient ?? new GameClient();
  }

  /**
   * Update a character's money through the narrow, money-only endpoint (issue #615), through
   * {@link RequestStore.mutate} (issue #830) so the character's cached `GET` data is purged on
   * success instead of going stale.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Character id.
   * @param {string|null} token - Authentication token, unused — kept for call-site compatibility;
   *   `RequestStore.mutate` resolves its own token.
   * @param {number} money - New total money value.
   * @returns {Promise<Response>} Fetch response.
   */
  updateCharacterMoney(gameSlug, characterId, token, money) {
    return RequestStore.mutate({
      componentName: 'CharacterController',
      resource: this.#resourceName(),
      method: 'PUT',
      quantityType: 'single',
      params: { gameSlug, id: characterId },
      body: { money },
    });
  }

  /**
   * Marks a photo as the character's profile photo, through {@link RequestStore.mutate}
   * (issue #830) so the character's cached `GET` data is purged on success instead of going
   * stale.
   *
   * @description Unlike {@link BaseCharacterPhotosController#setProfilePhoto}, this does not
   *   refetch the character itself — `CharacterDetail.jsx` already refreshes via
   *   `controller.buildEffect()()` after other mutations, so the caller is responsible for
   *   triggering that refresh on success (after this mutation's own cache purge has completed).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string|number} photoId - Id of the photo to mark as profile photo.
   * @returns {Promise<Response>} Fetch response.
   */
  setProfilePhoto(gameSlug, characterId, photoId) {
    return RequestStore.mutate({
      componentName: 'CharacterController',
      resource: this.#resourceName(),
      method: 'PATCH',
      quantityType: 'photo',
      params: { gameSlug, id: characterId, photoId },
      body: { roles: ['profile'] },
    });
  }

  /**
   * Resolve access via {@link AccessStore}'s fail-closed readers and merge it into the character;
   * re-runs the same merge once the real access/permissions fetches resolve, marking
   * `access_resolved` `true` (vs. a not-yet-known fail-closed pass). Unrelated to which endpoint
   * variant `loadCharacter`'s `RequestStore.ensure` call already picked to fetch the character
   * body itself (see this class's own description).
   *
   * @param {object} character - Base character data already loaded.
   * @param {object} params - Route params with game_slug and character_id.
   * @param {string|null} token - Authentication token.
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @returns {object} The character merged with the fail-closed access/permission pass.
   */
  fetchAndMergeAccess(character, params, token, safeSet) {
    const firstPass = this.#loadCharacterAccess(character, params, safeSet, false);

    Promise.all([
      AccessStore.ensureCharacterAccess(this.characterKind, params.game_slug, params.character_id),
      AccessStore.ensureCharacterPermissions(this.characterKind, params.game_slug, params.character_id),
    ]).then(() => this.#loadCharacterAccess(character, params, safeSet, true));

    return firstPass;
  }

  #loadCharacterAccess(character, params, safeSet, resolved) {
    const characterWithAccess = CharacterAccessResolver.merge(this.characterKind, character, params, resolved);

    safeSet(this.setCharacter, characterWithAccess);
    return characterWithAccess;
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
   * Resource name (`'pc'`/`'npc'`) `RequestStore`/`resourceConfig` key this controller's
   * `characterKind` (`'pcs'`/`'npcs'`) maps to.
   *
   * @returns {string} `'pc'` or `'npc'`.
   */
  #resourceName() {
    return this.characterKind === 'npcs' ? 'npc' : 'pc';
  }

  /**
   * Load the character, merge treasures/items/documents/photos/game_type/access, and update
   * loading state.
   *
   * @param {object} params - Route params with game_slug and character_id.
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @returns {Promise<void>} Resolves once the character state is updated.
   */
  loadCharacter(params, safeSet) {
    const token = AuthStorage.getToken();

    return RequestStore.ensure({
      componentName: 'CharacterController',
      resource: this.#resourceName(),
      quantityType: 'single',
      params: { gameSlug: params.game_slug, id: params.character_id },
    })
      .then(({ data }) => data)
      .then((character) => this.fetchAndMergeTreasures(character, params))
      .then((character) => this.fetchAndMergeItems(character, params))
      .then((character) => this.fetchAndMergeDocuments(character, params))
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

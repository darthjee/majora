import AuthStorage from './AuthStorage.js';
import AccessStoreKeys from './AccessStoreKeys.js';
import AccessStoreLogging from './AccessStoreLogging.js';

const ACCESS_DEFAULT = {
  username: null,
  is_superuser: null,
  is_staff: null,
  is_dm: null,
  is_player: false,
  is_owner: false,
};

/**
 * Identity-access (`*Access`) checks for {@link AccessStore} — game,
 * character, and treasure — kept separate so this always-real-identity
 * family doesn't compete for line budget with the store's role-aware
 * `*Permissions` family.
 */
export default class AccessStoreAccess {
  /**
   * Resolve (or start) the identity access check for a game.
   *
   * @param {import('./AccessCache.js').default} cache - Shared cache instance.
   * @param {import('../client/GameClient.js').default} gameClient - Game client.
   * @param {string} gameSlug - Game slug.
   * @returns {Promise<object>} Resolves to the access payload.
   */
  static ensureGame(cache, gameClient, gameSlug) {
    return cache.ensure(
      AccessStoreKeys.game(gameSlug),
      (signal) => AccessStoreLogging.wrap(
        'ensureGame',
        [gameSlug],
        gameClient.fetchGameAccess(gameSlug, AuthStorage.getToken(), signal).then(AccessStoreAccess.#parse),
      ),
      ACCESS_DEFAULT,
    );
  }

  /**
   * Resolve (or start) the identity access check for a character.
   *
   * @param {import('./AccessCache.js').default} cache - Shared cache instance.
   * @param {import('../client/CharacterClient.js').default} characterClient - Character client.
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @returns {Promise<object>} Resolves to the access payload.
   */
  static ensureCharacter(cache, characterClient, characterKind, gameSlug, characterId) {
    return cache.ensure(
      AccessStoreKeys.character(characterKind, gameSlug, characterId),
      (signal) => AccessStoreLogging.wrap(
        'ensureCharacter',
        [characterKind, gameSlug, characterId],
        characterClient
          .fetchCharacterAccess(characterKind, gameSlug, characterId, AuthStorage.getToken(), signal)
          .then(AccessStoreAccess.#parse),
      ),
      ACCESS_DEFAULT,
    );
  }

  /**
   * Resolve (or start) the identity access check for a treasure.
   *
   * @param {import('./AccessCache.js').default} cache - Shared cache instance.
   * @param {import('../client/TreasureClient.js').default} treasureClient - Treasure client.
   * @param {string|number} id - Treasure id.
   * @returns {Promise<object>} Resolves to the access payload.
   */
  static ensureTreasure(cache, treasureClient, id) {
    return cache.ensure(
      AccessStoreKeys.treasure(id),
      (signal) => AccessStoreLogging.wrap(
        'ensureTreasure',
        [id],
        treasureClient.fetchTreasureAccess(id, AuthStorage.getToken(), signal).then(AccessStoreAccess.#parse),
      ),
      ACCESS_DEFAULT,
    );
  }

  /**
   * Synchronously read the currently cached game access, without triggering a fetch.
   *
   * @param {import('./AccessCache.js').default} cache - Shared cache instance.
   * @param {string} gameSlug - Game slug.
   * @returns {object} The cached access payload, or the fail-closed default.
   */
  static getGame(cache, gameSlug) {
    return cache.read(AccessStoreKeys.game(gameSlug), ACCESS_DEFAULT);
  }

  /**
   * Synchronously read the currently cached character access, without triggering a fetch.
   *
   * @param {import('./AccessCache.js').default} cache - Shared cache instance.
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @returns {object} The cached access payload, or the fail-closed default.
   */
  static getCharacter(cache, characterKind, gameSlug, characterId) {
    return cache.read(AccessStoreKeys.character(characterKind, gameSlug, characterId), ACCESS_DEFAULT);
  }

  /**
   * Synchronously read the currently cached treasure access, without triggering a fetch.
   *
   * @param {import('./AccessCache.js').default} cache - Shared cache instance.
   * @param {string|number} id - Treasure id.
   * @returns {object} The cached access payload, or the fail-closed default.
   */
  static getTreasure(cache, id) {
    return cache.read(AccessStoreKeys.treasure(id), ACCESS_DEFAULT);
  }

  static #parse(response) {
    if (!response.ok) {
      return Promise.reject(new Error('access request failed'));
    }

    return response.json();
  }
}

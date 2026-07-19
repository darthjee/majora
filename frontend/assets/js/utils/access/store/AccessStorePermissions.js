import AuthStorage from '../../auth/AuthStorage.js';
import AccessStoreKeys from './AccessStoreKeys.js';
import AccessStoreFacade from './AccessStoreFacade.js';
import AccessStoreLogging from './AccessStoreLogging.js';
import parseJsonOrReject from '../../http/parseJsonOrReject.js';

const PERMISSIONS_DEFAULT = { can_edit: false };

/**
 * Edit-permissions (`*Permissions`) checks for {@link AccessStore} — game,
 * character, and treasure — kept separate so this role-aware (`can_edit`,
 * for the real identity or, given a role set, simulated via
 * {@link AccessStoreFacade}) family doesn't compete for line budget with
 * the store's always-real-identity `*Access` family.
 */
export default class AccessStorePermissions {
  /**
   * Resolve (or start) the edit-permissions check for a game.
   *
   * @param {import('../AccessCache.js').default} cache - Shared cache instance.
   * @param {import('../../../client/GameClient.js').default} gameClient - Game client.
   * @param {string} gameSlug - Game slug.
   * @param {string[]} roles - Roles to simulate instead of the requester's own identity.
   * @returns {Promise<{can_edit: boolean}>} Resolves to the permissions payload.
   */
  static ensureGame(cache, gameClient, gameSlug, roles) {
    const roleSet = AccessStoreKeys.normalizeRoles(AccessStoreFacade.effectiveRoles(roles));

    return AccessStorePermissions.#loggedEnsure(
      cache,
      AccessStoreKeys.gamePermissions(gameSlug, roleSet),
      'ensureGame',
      [gameSlug, roles],
      (signal) => gameClient.fetchGamePermissions(gameSlug, AuthStorage.getToken(), signal, roleSet)
        .then(AccessStorePermissions.#parse),
      PERMISSIONS_DEFAULT,
      { roles, effectiveRoles: roleSet },
    );
  }

  /**
   * Resolve (or start) the edit-permissions check for a character.
   *
   * @param {import('../AccessCache.js').default} cache - Shared cache instance.
   * @param {import('../../../client/CharacterClient.js').default} characterClient - Character client.
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string[]} roles - Roles to simulate instead of the requester's own identity.
   * @returns {Promise<{can_edit: boolean}>} Resolves to the permissions payload.
   */
  static ensureCharacter(cache, characterClient, characterKind, gameSlug, characterId, roles) {
    const roleSet = AccessStoreKeys.normalizeRoles(AccessStoreFacade.effectiveRoles(roles));

    return AccessStorePermissions.#loggedEnsure(
      cache,
      AccessStoreKeys.characterPermissions(characterKind, gameSlug, characterId, roleSet),
      'ensureCharacter',
      [characterKind, gameSlug, characterId, roles],
      (signal) => characterClient
        .fetchCharacterPermissions(characterKind, gameSlug, characterId, AuthStorage.getToken(), signal, roleSet)
        .then(AccessStorePermissions.#parse),
      PERMISSIONS_DEFAULT,
      { roles, effectiveRoles: roleSet },
    );
  }

  /**
   * Resolve (or start) the edit-permissions check for a treasure.
   *
   * @param {import('../AccessCache.js').default} cache - Shared cache instance.
   * @param {import('../../../client/TreasureClient.js').default} treasureClient - Treasure client.
   * @param {string|number} id - Treasure id.
   * @param {string[]} roles - Roles to simulate instead of the requester's own identity.
   * @returns {Promise<{can_edit: boolean}>} Resolves to the permissions payload.
   */
  static ensureTreasure(cache, treasureClient, id, roles) {
    const roleSet = AccessStoreKeys.normalizeRoles(AccessStoreFacade.effectiveRoles(roles));

    return AccessStorePermissions.#loggedEnsure(
      cache,
      AccessStoreKeys.treasurePermissions(id, roleSet),
      'ensureTreasure',
      [id, roles],
      (signal) => treasureClient.fetchTreasurePermissions(id, AuthStorage.getToken(), signal, roleSet)
        .then(AccessStorePermissions.#parse),
      PERMISSIONS_DEFAULT,
      { roles, effectiveRoles: roleSet },
    );
  }

  /**
   * Synchronously read the currently cached game permissions, without triggering a fetch.
   *
   * @param {import('../AccessCache.js').default} cache - Shared cache instance.
   * @param {string} gameSlug - Game slug.
   * @param {string[]} roles - Role set the cached lookup was made for.
   * @returns {{can_edit: boolean}} The cached permissions payload, or the fail-closed default.
   */
  static getGame(cache, gameSlug, roles) {
    return cache.read(
      AccessStoreKeys.gamePermissions(gameSlug, AccessStoreKeys.normalizeRoles(roles)), PERMISSIONS_DEFAULT,
    );
  }

  /**
   * Synchronously read the currently cached character permissions, without triggering a fetch.
   *
   * @param {import('../AccessCache.js').default} cache - Shared cache instance.
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @param {string[]} roles - Role set the cached lookup was made for.
   * @returns {{can_edit: boolean}} The cached permissions payload, or the fail-closed default.
   */
  static getCharacter(cache, characterKind, gameSlug, characterId, roles) {
    return cache.read(
      AccessStoreKeys.characterPermissions(characterKind, gameSlug, characterId, AccessStoreKeys.normalizeRoles(roles)),
      PERMISSIONS_DEFAULT,
    );
  }

  /**
   * Synchronously read the currently cached treasure permissions, without triggering a fetch.
   *
   * @param {import('../AccessCache.js').default} cache - Shared cache instance.
   * @param {string|number} id - Treasure id.
   * @param {string[]} roles - Role set the cached lookup was made for.
   * @returns {{can_edit: boolean}} The cached permissions payload, or the fail-closed default.
   */
  static getTreasure(cache, id, roles) {
    return cache.read(
      AccessStoreKeys.treasurePermissions(id, AccessStoreKeys.normalizeRoles(roles)), PERMISSIONS_DEFAULT,
    );
  }

  /**
   * Run `cache.ensure` for an `ensure*` check, wrapping the fetcher's raw
   * promise with {@link AccessStoreLogging.wrap} so its outcome is observable
   * at `debug` level.
   *
   * @param {import('../AccessCache.js').default} cache - Shared cache instance.
   * @param {string} key - Cache key.
   * @param {string} method - Name of the calling `ensure*` method (e.g. `'ensureGame'`).
   * @param {Array} args - Arguments the calling method was called with.
   * @param {Function} fetcher - Called with an `AbortSignal`; must return a `Promise`.
   * @param {*} defaultValue - Value resolved when the fetcher rejects (fail-closed).
   * @param {object} [meta] - Extra fields folded into the logged entry (e.g. `roles`/`effectiveRoles`).
   * @returns {Promise<*>} Resolves to the cached, freshly-fetched, or default value.
   */
  static #loggedEnsure(cache, key, method, args, fetcher, defaultValue, meta) {
    return cache.ensure(
      key,
      (signal) => AccessStoreLogging.wrap(method, args, fetcher(signal), meta),
      defaultValue,
    );
  }

  static #parse(response) {
    return parseJsonOrReject(response, 'access request failed');
  }
}

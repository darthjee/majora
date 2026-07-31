import AuthStorage from '../../auth/AuthStorage.js';
import AccessStoreKeys from './AccessStoreKeys.js';
import AccessStoreAccess from './AccessStoreAccess.js';
import AccessStoreFacade from './AccessStoreFacade.js';
import AccessStoreRoles from './AccessStoreRoles.js';
import AccessStoreLogging from './AccessStoreLogging.js';
import parseJsonOrReject from '../../http/parseJsonOrReject.js';

const PERMISSIONS_DEFAULT = { can_edit: false };

/**
 * Edit-permissions (`*Permissions`) checks for {@link AccessStore} — game,
 * character, and treasure — kept separate so this role-aware (`can_edit`,
 * for the real identity or, given an active {@link AccessStoreFacade}
 * mock, a simulated one) family doesn't compete for line budget with the
 * store's always-real-identity `*Access` family.
 *
 * @description The role set sent on every request is always derived — never
 *   the historically-always-empty caller-supplied array — from the
 *   resource's own already-resolved `*Access` cache entry (read
 *   synchronously, so callers must sequence the corresponding `ensure*Access`
 *   before their first `ensure*Permissions` call for a route), via
 *   {@link AccessStoreRoles.fromAccess}, then run through
 *   {@link AccessStoreFacade.rolesForPermissionsRequest} so an active "view
 *   as" facade can override it.
 */
export default class AccessStorePermissions {
  /**
   * Resolve (or start) the edit-permissions check for a game.
   *
   * @param {import('../AccessCache.js').default} cache - Shared cache instance.
   * @param {import('../../../client/GameClient.js').default} gameClient - Game client.
   * @param {string} gameSlug - Game slug.
   * @returns {Promise<{can_edit: boolean}>} Resolves to the permissions payload.
   */
  static ensureGame(cache, gameClient, gameSlug) {
    const roleSet = AccessStorePermissions.#roleSet(AccessStoreAccess.getGame(cache, gameSlug));

    return AccessStorePermissions.#loggedEnsure(
      cache,
      AccessStoreKeys.gamePermissions(gameSlug, roleSet),
      'ensureGame',
      [gameSlug],
      (signal) => gameClient.fetchGamePermissions(gameSlug, AuthStorage.getToken(), signal, roleSet)
        .then(AccessStorePermissions.#parse),
      PERMISSIONS_DEFAULT,
      { roleSet },
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
   * @returns {Promise<{can_edit: boolean, can_exchange_treasure: boolean,
   *   can_set_profile_photo: boolean, can_delete_photo: boolean}>} Resolves to the permissions payload.
   */
  static ensureCharacter(cache, characterClient, characterKind, gameSlug, characterId) {
    const roleSet = AccessStorePermissions.#roleSet(
      AccessStoreAccess.getCharacter(cache, characterKind, gameSlug, characterId),
    );

    return AccessStorePermissions.#loggedEnsure(
      cache,
      AccessStoreKeys.characterPermissions(characterKind, gameSlug, characterId, roleSet),
      'ensureCharacter',
      [characterKind, gameSlug, characterId],
      (signal) => characterClient
        .fetchCharacterPermissions(characterKind, gameSlug, characterId, AuthStorage.getToken(), signal, roleSet)
        .then(AccessStorePermissions.#parse),
      PERMISSIONS_DEFAULT,
      { roleSet },
    );
  }

  /**
   * Resolve (or start) the edit-permissions check for a treasure.
   *
   * @param {import('../AccessCache.js').default} cache - Shared cache instance.
   * @param {import('../../../client/TreasureClient.js').default} treasureClient - Treasure client.
   * @param {string|number} id - Treasure id.
   * @param {boolean} [isExclusive] - Whether this treasure is game-exclusive (non-null/non-empty
   *   `game_slug` on its already-loaded detail). Threaded through to
   *   {@link TreasureClient#fetchTreasurePermissions} to pick the matching route; not part of the
   *   cache key (see {@link AccessStoreKeys.treasurePermissions}) since a given treasure id is
   *   always either scoped or global, never both.
   * @returns {Promise<{can_edit: boolean}>} Resolves to the permissions payload.
   */
  static ensureTreasure(cache, treasureClient, id, isExclusive = false) {
    const roleSet = AccessStorePermissions.#roleSet(AccessStoreAccess.getTreasure(cache, id));

    return AccessStorePermissions.#loggedEnsure(
      cache,
      AccessStoreKeys.treasurePermissions(id, roleSet),
      'ensureTreasure',
      [id],
      (signal) => treasureClient.fetchTreasurePermissions(id, AuthStorage.getToken(), signal, roleSet, isExclusive)
        .then(AccessStorePermissions.#parse),
      PERMISSIONS_DEFAULT,
      { roleSet },
    );
  }

  /**
   * Synchronously read the currently cached game permissions, without triggering a fetch.
   *
   * @param {import('../AccessCache.js').default} cache - Shared cache instance.
   * @param {string} gameSlug - Game slug.
   * @returns {{can_edit: boolean}} The cached permissions payload, or the fail-closed default.
   */
  static getGame(cache, gameSlug) {
    const roleSet = AccessStorePermissions.#roleSet(AccessStoreAccess.getGame(cache, gameSlug));

    return cache.read(AccessStoreKeys.gamePermissions(gameSlug, roleSet), PERMISSIONS_DEFAULT);
  }

  /**
   * Synchronously read the currently cached character permissions, without triggering a fetch.
   *
   * @param {import('../AccessCache.js').default} cache - Shared cache instance.
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @returns {{can_edit: boolean, can_exchange_treasure: boolean,
   *   can_set_profile_photo: boolean, can_delete_photo: boolean}} The cached permissions payload,
   *   or the fail-closed default.
   */
  static getCharacter(cache, characterKind, gameSlug, characterId) {
    const roleSet = AccessStorePermissions.#roleSet(
      AccessStoreAccess.getCharacter(cache, characterKind, gameSlug, characterId),
    );

    return cache.read(
      AccessStoreKeys.characterPermissions(characterKind, gameSlug, characterId, roleSet), PERMISSIONS_DEFAULT,
    );
  }

  /**
   * Synchronously read the currently cached treasure permissions, without triggering a fetch.
   *
   * @param {import('../AccessCache.js').default} cache - Shared cache instance.
   * @param {string|number} id - Treasure id.
   * @returns {{can_edit: boolean}} The cached permissions payload, or the fail-closed default.
   */
  static getTreasure(cache, id) {
    const roleSet = AccessStorePermissions.#roleSet(AccessStoreAccess.getTreasure(cache, id));

    return cache.read(AccessStoreKeys.treasurePermissions(id, roleSet), PERMISSIONS_DEFAULT);
  }

  /**
   * Derive the final role set to request/cache under for a resource's
   * `*Permissions` check: the resource's own real, derived roles
   * (see {@link AccessStoreRoles.fromAccess}), run through
   * {@link AccessStoreFacade.rolesForPermissionsRequest} and normalized
   * (see {@link AccessStoreKeys.normalizeRoles}). Shared by every `ensure*`
   * and `get*` variant so both always compute the exact same cache key.
   *
   * @param {object} access - The resource's own cached `*Access` payload.
   * @returns {string[]} The normalized, final role set.
   */
  static #roleSet(access) {
    const realRoles = AccessStoreRoles.fromAccess(access);

    return AccessStoreKeys.normalizeRoles(AccessStoreFacade.rolesForPermissionsRequest(realRoles));
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
   * @param {object} [meta] - Extra fields folded into the logged entry (e.g. `roleSet`).
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

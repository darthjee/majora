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
 * @description The role set sent on every request is always derived from
 *   the resource's own `*Access` cache entry via
 *   {@link AccessStoreRoles.fromAccess}, then run through
 *   {@link AccessStoreFacade.rolesForPermissionsRequest} so an active "view
 *   as" facade can override it. Every `ensure*` method is **self-correcting**:
 *   it fires an optimistic fetch immediately using whatever role set the
 *   `*Access` cache currently holds (today's fail-closed default when
 *   nothing has populated it yet — no added latency vs. reading it
 *   synchronously), in parallel ensures the sibling `*Access` check itself
 *   (deduped by {@link AccessCache} against any fetch a route-level
 *   `syncForRoute` already started), and — only if the resolved access
 *   implies a different role set than the optimistic guess — issues a
 *   corrected fetch and resolves to that instead. Callers therefore no
 *   longer need to sequence `ensure*Access` before their first
 *   `ensure*Permissions` call for a route to get a correct result.
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
    const fetchForRoleSet = (roleSet) => AccessStorePermissions.#loggedEnsure(
      cache,
      AccessStoreKeys.gamePermissions(gameSlug, roleSet),
      'ensureGame',
      [gameSlug],
      (signal) => gameClient.fetchGamePermissions(gameSlug, AuthStorage.getToken(), signal, roleSet)
        .then(AccessStorePermissions.#parse),
      PERMISSIONS_DEFAULT,
      { roleSet },
    );

    return AccessStorePermissions.#selfCorrectingEnsure(
      fetchForRoleSet,
      AccessStoreAccess.getGame(cache, gameSlug),
      AccessStoreAccess.ensureGame(cache, gameClient, gameSlug),
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
    const fetchForRoleSet = (roleSet) => AccessStorePermissions.#loggedEnsure(
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

    return AccessStorePermissions.#selfCorrectingEnsure(
      fetchForRoleSet,
      AccessStoreAccess.getCharacter(cache, characterKind, gameSlug, characterId),
      AccessStoreAccess.ensureCharacter(cache, characterClient, characterKind, gameSlug, characterId),
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
    const fetchForRoleSet = (roleSet) => AccessStorePermissions.#loggedEnsure(
      cache,
      AccessStoreKeys.treasurePermissions(id, roleSet),
      'ensureTreasure',
      [id],
      (signal) => treasureClient.fetchTreasurePermissions(id, AuthStorage.getToken(), signal, roleSet, isExclusive)
        .then(AccessStorePermissions.#parse),
      PERMISSIONS_DEFAULT,
      { roleSet },
    );

    return AccessStorePermissions.#selfCorrectingEnsure(
      fetchForRoleSet,
      AccessStoreAccess.getTreasure(cache, id),
      AccessStoreAccess.ensureTreasure(cache, treasureClient, id),
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
   * Drive the optimistic-then-self-correcting flow shared by every
   * `ensure*` method: fire `fetchForRoleSet` immediately under the role set
   * derived from `initialAccess` (today's synchronous, possibly
   * fail-closed-default, cache read), and — once `accessPromise` resolves —
   * recompute the role set from the resolved access. If it's unchanged,
   * resolve with the optimistic fetch's result (no redundant second
   * network call); otherwise issue a corrected fetch under the new role set
   * and resolve with that instead.
   *
   * @param {Function} fetchForRoleSet - Called with a normalized role set
   *   (see {@link AccessStorePermissions.#roleSet}); must return the
   *   `Promise` from the corresponding `#loggedEnsure` call for that role set.
   * @param {object} initialAccess - The resource's `*Access` cache entry as
   *   read synchronously right now (see `AccessStoreAccess.get*`).
   * @param {Promise<object>} accessPromise - The resource's own
   *   `AccessStoreAccess.ensure*` promise, resolving to the (possibly
   *   corrected) access payload.
   * @returns {Promise<*>} Resolves to the optimistic or corrected permissions result.
   */
  static #selfCorrectingEnsure(fetchForRoleSet, initialAccess, accessPromise) {
    const optimisticRoleSet = AccessStorePermissions.#roleSet(initialAccess);
    const optimisticPromise = fetchForRoleSet(optimisticRoleSet);

    return accessPromise.then((resolvedAccess) => {
      const correctedRoleSet = AccessStorePermissions.#roleSet(resolvedAccess);

      if (AccessStorePermissions.#sameRoleSet(correctedRoleSet, optimisticRoleSet)) {
        return optimisticPromise;
      }

      return fetchForRoleSet(correctedRoleSet);
    });
  }

  /**
   * Compare two normalized role sets (see {@link AccessStorePermissions.#roleSet},
   * always sorted/deduplicated) for equality.
   *
   * @param {string[]} a - First normalized role set.
   * @param {string[]} b - Second normalized role set.
   * @returns {boolean} Whether both role sets contain the same roles.
   */
  static #sameRoleSet(a, b) {
    return a.length === b.length && a.every((role, index) => role === b[index]);
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

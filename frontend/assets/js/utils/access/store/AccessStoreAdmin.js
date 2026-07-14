import AuthStorage from '../../auth/AuthStorage.js';
import AccessStoreLogging from './AccessStoreLogging.js';

const SUPERUSER_KEY = 'admin:superuser';
const STAFF_KEY = 'admin:staff';
const ADMIN_DEFAULT = false;

/**
 * Superuser / staff-or-superuser identity checks for {@link AccessStore},
 * kept separate so these two fixed, resource-less checks don't compete for
 * line budget with the store's per-resource access/permissions
 * orchestration.
 */
export default class AccessStoreAdmin {
  /**
   * Resolve (or start) the superuser check for the current user.
   *
   * @param {import('../AccessCache.js').default} cache - Shared cache instance.
   * @param {import('../../../client/AuthClient.js').default} authClient - Auth client used to fetch status.
   * @returns {Promise<boolean>} Resolves to true when the user is a superuser.
   */
  static ensureSuperUser(cache, authClient) {
    return AccessStoreAdmin.#loggedEnsure(
      cache,
      SUPERUSER_KEY,
      'ensureSuperUser',
      [],
      (signal) => authClient.status(AuthStorage.getToken(), signal)
        .then((response) => AccessStoreAdmin.#parseStatusResponse(response, (data) => Boolean(data.is_superuser))),
      ADMIN_DEFAULT,
    );
  }

  /**
   * Resolve (or start) the staff-or-superuser check for the current user.
   *
   * @param {import('../AccessCache.js').default} cache - Shared cache instance.
   * @param {import('../../../client/AuthClient.js').default} authClient - Auth client used to fetch status.
   * @returns {Promise<boolean>} Resolves to true when the user is staff or a superuser.
   */
  static ensureStaffOrSuperUser(cache, authClient) {
    return AccessStoreAdmin.#loggedEnsure(
      cache,
      STAFF_KEY,
      'ensureStaffOrSuperUser',
      [],
      (signal) => authClient.status(AuthStorage.getToken(), signal).then((response) => AccessStoreAdmin
        .#parseStatusResponse(response, (data) => Boolean(data.is_superuser) || Boolean(data.is_staff))),
      ADMIN_DEFAULT,
    );
  }

  /**
   * Synchronously read whether the current user is a superuser, without triggering a fetch.
   *
   * @param {import('../AccessCache.js').default} cache - Shared cache instance.
   * @returns {boolean} The cached result, or `false` while unresolved.
   */
  static isSuperUser(cache) {
    return cache.read(SUPERUSER_KEY, ADMIN_DEFAULT);
  }

  /**
   * Synchronously read whether the current user is staff or a superuser, without
   * triggering a fetch.
   *
   * @param {import('../AccessCache.js').default} cache - Shared cache instance.
   * @returns {boolean} The cached result, or `false` while unresolved.
   */
  static isStaffOrSuperUser(cache) {
    return cache.read(STAFF_KEY, ADMIN_DEFAULT);
  }

  /**
   * Run `cache.ensure` for an `ensure*` check, wrapping the fetcher's raw
   * promise with {@link AccessStoreLogging.wrap} so its outcome is observable
   * at `debug` level.
   *
   * @param {import('../AccessCache.js').default} cache - Shared cache instance.
   * @param {string} key - Cache key.
   * @param {string} method - Name of the calling `ensure*` method (e.g. `'ensureSuperUser'`).
   * @param {Array} args - Arguments the calling method was called with.
   * @param {Function} fetcher - Called with an `AbortSignal`; must return a `Promise`.
   * @param {*} defaultValue - Value resolved when the fetcher rejects (fail-closed).
   * @returns {Promise<*>} Resolves to the cached, freshly-fetched, or default value.
   */
  static #loggedEnsure(cache, key, method, args, fetcher, defaultValue) {
    return cache.ensure(
      key,
      (signal) => AccessStoreLogging.wrap(method, args, fetcher(signal)),
      defaultValue,
    );
  }

  static #parseStatusResponse(response, extract) {
    if (!response.ok) {
      return Promise.reject(new Error('status request failed'));
    }

    return response.json().then(extract);
  }
}

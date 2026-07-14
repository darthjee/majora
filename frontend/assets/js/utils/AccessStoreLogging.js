import MajoraLogger from './MajoraLogger.js';

/**
 * Debug-log wrapper shared by {@link AccessStoreAccess},
 * {@link AccessStorePermissions}, and {@link AccessStoreAdmin}, kept
 * separate so the check-and-log concern doesn't clutter each family's own
 * fetch orchestration.
 *
 * @description `AccessCache.ensure` fails closed on any fetcher rejection,
 *   silently swallowing the error before it ever reaches the caller. Wrapping
 *   the raw fetcher promise here — before `AccessCache` catches it — is what
 *   makes the original success/failure outcome observable at `debug` level.
 */
export default class AccessStoreLogging {
  /**
   * Wrap a fetcher's raw promise with a `debug`-level {@link MajoraLogger}
   * observer that reports its outcome, without altering the resolved value
   * or rejection seen by the caller (e.g. `AccessCache.ensure`).
   *
   * @param {string} method - Name of the wrapped `AccessStore*` method (e.g. `'ensureGame'`).
   * @param {Array} args - Arguments the wrapped method was called with.
   * @param {Promise<*>} fetcherPromise - The fetcher's raw promise, before `AccessCache` catches any rejection.
   * @param {object} [meta] - Extra fields folded into the logged entry (e.g. `roles`/`effectiveRoles`).
   * @returns {Promise<*>} `fetcherPromise`, unchanged.
   */
  static wrap(method, args, fetcherPromise, meta = {}) {
    fetcherPromise.then(
      (result) => MajoraLogger.debug({ method, args, ...meta, result }),
      (error) => MajoraLogger.debug({ method, args, ...meta, error }),
    );

    return fetcherPromise;
  }
}

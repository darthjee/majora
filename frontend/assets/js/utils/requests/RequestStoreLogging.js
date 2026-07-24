import MajoraLogger from '../logging/MajoraLogger.js';

/**
 * Debug-log wrapper for every {@link RequestStore#ensure} call, mirroring
 * {@link AccessStoreLogging}'s outcome-logging shape but also logging once when the call
 * starts, not only on settlement — unlike `AccessStoreLogging`'s callers (which already know
 * their own method name), `RequestStore.ensure()` has no way to attribute a call to a component
 * unless the caller passes one in explicitly, so the start-of-call log is what makes that
 * attribution observable even for requests that never settle (e.g. aborted).
 */
export default class RequestStoreLogging {
  /**
   * Wrap a `RequestStore.ensure()` call's raw promise with `debug`-level {@link MajoraLogger}
   * observers reporting both the start and the settlement (result/error) of the request, without
   * altering the resolved value or rejection seen by the caller.
   *
   * @param {string} componentName - Name of the component/controller that triggered the request
   *   (e.g. `'CharacterController'`, `'GameController'`).
   * @param {string} method - HTTP method (`'GET'`, `'POST'`, `'PATCH'`, or `'PUT'`).
   * @param {string} resource - Resource type (`'game'`, `'npc'`, `'pc'`, `'item'`, `'treasure'`,
   *   `'session'`, `'document'`).
   * @param {string} quantityType - `'collection'` or `'single'`.
   * @param {object} params - Concrete params (`gameSlug`, `id`, etc.) the request was made with.
   * @param {object} query - Query/filters the request was made with.
   * @param {Promise<*>} requestPromise - The request's raw promise.
   * @returns {Promise<*>} `requestPromise`, unchanged.
   */
  static wrap(componentName, method, resource, quantityType, params, query, requestPromise) {
    const meta = {
      componentName, method, resource, quantityType, params, query,
    };

    MajoraLogger.debug({ ...meta, event: 'start' });

    requestPromise.then(
      (result) => MajoraLogger.debug({ ...meta, event: 'settled', result }),
      (error) => MajoraLogger.debug({ ...meta, event: 'settled', error }),
    );

    return requestPromise;
  }
}

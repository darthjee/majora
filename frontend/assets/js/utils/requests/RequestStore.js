import AuthEvents from '../auth/AuthEvents.js';
import AccessEvents from '../access/AccessEvents.js';
import resourceConfig from './resourceConfig.js';
import RequestPermissionResolvers from './RequestPermissionResolvers.js';
import Request from './Request.js';

const requests = new Map();

/**
 * Centralized, frontend-only store for resource-data requests (game, npc, pc, item, treasure),
 * mirroring {@link AccessStore}'s shape. Owns one {@link Request} instance per resource/
 * quantity-type/params combination and resolves the live permissions each `Request` should
 * evaluate (via {@link RequestPermissionResolvers}) before delegating to it.
 *
 * @description This issue (#778) only introduces this structure; no existing controller/
 *   component is rewired to call `ensure()`, and nothing wires `subscribe()` into application
 *   bootstrap yet — both are left for a follow-up issue, mirroring how `AppController.js` is the
 *   one that wires `AccessStore.syncForAuthChange` to `AuthEvents`, rather than `AccessStore`
 *   subscribing to itself.
 */
export default class RequestStore {
  /**
   * Resolve (or start) the request for a resource/quantity-type/params/query combination,
   * creating the underlying `Request` instance on first use.
   *
   * @param {object} args - Arguments.
   * @param {string} args.resource - Resource name (`'game'`, `'npc'`, `'pc'`, `'item'`, `'treasure'`,
   *   `'session'`, `'document'`).
   * @param {string} args.quantityType - `'collection'` or `'single'`.
   * @param {object} [args.params] - Concrete params (`gameSlug`, `id`, etc.).
   * @param {object} [args.query] - Query/filters.
   * @returns {Promise<{data: *, pagination: {page: number, pages: number, perPage: number}}>}
   *   Resolves to the wrapped resource data and its pagination metadata.
   */
  static ensure({ resource, quantityType, params = {}, query = {} }) {
    const entry = RequestStore.#entryFor(resource, quantityType, params);

    entry.query = query;

    return RequestPermissionResolvers.resolve(resource, quantityType, params)
      .then((permissions) => entry.request.ensure({ permissions, params, query }));
  }

  /**
   * Re-resolve the permissions for every currently-held `Request` and re-sync it — meant to be
   * called on auth/facade change (see {@link RequestStore.subscribe}) instead of a hard
   * `reset()`, since an in-flight request for the same resource/params/query may simply need to
   * switch from `regular` to `private` (or vice versa) rather than restart from scratch.
   *
   * @returns {void}
   */
  static resyncPermissions() {
    requests.forEach((entry) => {
      RequestPermissionResolvers.resolve(entry.resource, entry.quantityType, entry.params)
        .then((permissions) => entry.request.ensure({ permissions, params: entry.params, query: entry.query }));
    });
  }

  /**
   * Abort every in-flight request and clear all held `Request` instances.
   *
   * @returns {void}
   */
  static reset() {
    requests.forEach((entry) => entry.request.abort());
    requests.clear();
  }

  /**
   * Wire {@link RequestStore.resyncPermissions} to `AuthEvents` (auth change) and
   * `AccessEvents.subscribeFacadeChanged` (mock-role change) — the same two channels
   * `AppController.js` already wires `AccessStore` to. Not called automatically by this issue;
   * a future bootstrap step (once a consumer actually calls `ensure()`) is expected to call this
   * once, mirroring `AccessRouteConfigStore.load()`'s explicit, single call from
   * `AppController`'s constructor.
   *
   * @returns {Function} Unsubscribe function, undoing exactly this call's two subscriptions.
   */
  static subscribe() {
    const handleChange = () => RequestStore.resyncPermissions();

    AuthEvents.subscribe(handleChange);
    AccessEvents.subscribeFacadeChanged(handleChange);

    return () => {
      AuthEvents.unsubscribe(handleChange);
      AccessEvents.unsubscribeFacadeChanged(handleChange);
    };
  }

  static #entryFor(resource, quantityType, params) {
    const key = RequestStore.#key(resource, quantityType, params);
    const existing = requests.get(key);

    if (existing) {
      return existing;
    }

    const config = resourceConfig.get('GET', resource, quantityType);
    const entry = { request: new Request(resource, quantityType, config), resource, quantityType, params, query: {} };

    requests.set(key, entry);
    return entry;
  }

  static #key(resource, quantityType, params) {
    return [resource, quantityType, JSON.stringify(params ?? {})].join(':');
  }
}

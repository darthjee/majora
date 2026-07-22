import AccessCache from '../access/AccessCache.js';
import RequestClient from './RequestClient.js';

const defaultClient = new RequestClient();

/**
 * One logical resource+quantity-type request (held by a single
 * {@link RequestStore} entry, one per resource/quantity-type/params
 * combination), returning a promise consumers attach to.
 *
 * @description Each `ensure()` call picks the `regular` or `private`/full
 *   `resourceConfig` variant based on the currently-granted permission, then
 *   delegates the actual dedupe/cache/abort mechanics for that variant+params
 *   +query combination to {@link AccessCache} — the same primitive
 *   `AccessStore` already uses for access/permission checks. When a call
 *   resolves to a *different* cache key than the one currently active
 *   (permission, params, or query changed), the previous key's in-flight/
 *   cached `AccessCache` entry is aborted (`AccessCache#reset`, scoped to
 *   this `Request`'s own private instance) before the new one starts.
 *
 *   Every settled result is wrapped as `{ data }` — a fresh object each time,
 *   never a mutation of a previously-handed-out one — and any promise
 *   already handed out to earlier callers is *not* discarded when superseded:
 *   it stays pending and resolves once the *replacement* request settles, so
 *   no attached consumer is ever left hanging on an aborted request.
 */
export default class Request {
  #resource;
  #quantityType;
  #config;
  #client;
  #cache = new AccessCache();
  #activeKey = null;
  #promise = null;
  #resolve = null;
  #current;

  /**
   * Create a `Request` for one resource/quantity-type combination.
   *
   * @param {string} resource - Resource name (e.g. `'npc'`).
   * @param {string} quantityType - `'collection'` or `'single'`.
   * @param {{regular: object, private: object}} config - The resolved `resourceConfig` entry
   *   for this resource/quantity-type (its `GET` method's `regular`/`private` path+permission).
   * @param {RequestClient} [client] - HTTP client used to fetch the resolved path.
   */
  constructor(resource, quantityType, config, client = defaultClient) {
    this.#resource = resource;
    this.#quantityType = quantityType;
    this.#config = config;
    this.#client = client;
  }

  /**
   * Resolve (or start) this request for the given permissions/params/query.
   *
   * @param {object} [args] - Arguments.
   * @param {object} [args.permissions] - Currently-granted permissions object (e.g. `{ can_edit:
   *   true }`), as returned by `AccessStore.ensure*Permissions`.
   * @param {object} [args.params] - Concrete params (`gameSlug`, `id`, etc.) the configured
   *   `path` builders need.
   * @param {object} [args.query] - Query/filters, folded into the cache key so a query change
   *   is treated the same as a params/permission change.
   * @returns {Promise<{data: *}>} Resolves to the wrapped resource data.
   */
  ensure({ permissions = {}, params = {}, query = {} } = {}) {
    const variant = this.#resolveVariant(permissions, params);
    const key = Request.#buildKey(this.#resource, this.#quantityType, variant.name, params, query);

    if (key === this.#activeKey) {
      return this.#promise ?? Promise.resolve(this.#current);
    }

    this.#cache.reset();
    this.#activeKey = key;

    if (!this.#promise) {
      this.#promise = new Promise((resolve) => {
        this.#resolve = resolve;
      });
    }

    const exposedPromise = this.#promise;

    this.#cache
      .ensure(key, (signal) => this.#client.fetchResource(variant.path(params), signal), undefined)
      .then((data) => this.#settle(key, data));

    return exposedPromise;
  }

  /**
   * Abort any in-flight fetch and clear all cached/pending state. Used by
   * `RequestStore#reset`; does not resolve or reject any promise already
   * handed out, matching `AccessStore#reset`'s own
   * abandon-in-flight-work-without-pretending-it-succeeded semantics.
   *
   * @returns {void}
   */
  abort() {
    this.#cache.reset();
    this.#activeKey = null;
    this.#promise = null;
    this.#resolve = null;
    this.#current = undefined;
  }

  #settle(key, data) {
    if (this.#activeKey !== key) {
      return;
    }

    this.#current = { data };
    this.#resolve?.(this.#current);
    this.#promise = null;
    this.#resolve = null;
  }

  #resolveVariant(permissions, params) {
    const { regular, private: privateEntry } = this.#config;
    const permissionKey = typeof privateEntry.permission === 'function'
      ? privateEntry.permission(params)
      : privateEntry.permission;
    const granted = permissionKey !== null && permissionKey !== undefined && permissions?.[permissionKey] === true;

    return granted ? { ...privateEntry, name: 'private' } : { ...regular, name: 'regular' };
  }

  static #buildKey(resource, quantityType, variantName, params, query) {
    return [resource, quantityType, variantName, JSON.stringify(params ?? {}), JSON.stringify(query ?? {})].join(':');
  }
}

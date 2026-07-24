import AuthEvents from '../auth/AuthEvents.js';
import AccessEvents from '../access/AccessEvents.js';
import AuthStorage from '../auth/AuthStorage.js';
import resourceConfig from './resourceConfig.js';
import RequestPermissionResolvers from './RequestPermissionResolvers.js';
import Request from './Request.js';
import RequestStoreLogging from './RequestStoreLogging.js';
import RequestMutationClient from './RequestMutationClient.js';
import resolveVariant from './resolveVariant.js';

const requests = new Map();
const mutationClient = new RequestMutationClient();

/**
 * Centralized, frontend-only store for resource-data requests (game, npc, pc, item, treasure),
 * mirroring {@link AccessStore}'s shape. Owns one {@link Request} instance per resource/
 * quantity-type/params combination and resolves the live permissions each `Request` should
 * evaluate (via {@link RequestPermissionResolvers}) before delegating to it.
 *
 * @description Issue #778 introduced `ensure()` (`GET`); issue #830 added `mutate()`/`purge()`/
 *   `resolvePath()` so `POST`/`PATCH`/`PUT` requests can go through the same permission-based
 *   URL resolution, and so a successful mutation invalidates the affected resource's cached
 *   `GET` data instead of leaving it stale. Nothing wires `subscribe()` into application
 *   bootstrap yet — that is left for a follow-up issue, mirroring how `AppController.js` is the
 *   one that wires `AccessStore.syncForAuthChange` to `AuthEvents`, rather than `AccessStore`
 *   subscribing to itself.
 */
export default class RequestStore {
  /**
   * Resolve (or start) the request for a resource/quantity-type/params/query combination,
   * creating the underlying `Request` instance on first use.
   *
   * @param {object} args - Arguments.
   * @param {string} args.componentName - Name of the component/controller triggering the
   *   request (e.g. `'CharacterController'`, `'GameController'`), attached to the request's
   *   debug log (see {@link RequestStoreLogging}).
   * @param {string} args.resource - Resource name (`'game'`, `'npc'`, `'pc'`, `'item'`, `'treasure'`,
   *   `'session'`, `'document'`).
   * @param {string} args.quantityType - `'collection'` or `'single'`.
   * @param {object} [args.params] - Concrete params (`gameSlug`, `id`, etc.).
   * @param {object} [args.query] - Query/filters.
   * @returns {Promise<{data: *, pagination: {page: number, pages: number, perPage: number}}>}
   *   Resolves to the wrapped resource data and its pagination metadata.
   */
  static ensure({
    componentName, resource, quantityType, params = {}, query = {},
  }) {
    const entry = RequestStore.#entryFor(resource, quantityType, params);

    entry.query = query;

    const requestPromise = RequestPermissionResolvers.resolve(resource, quantityType, params)
      .then((permissions) => entry.request.ensure({ permissions, params, query }));

    return RequestStoreLogging.wrap(componentName, 'GET', resource, quantityType, params, query, requestPromise);
  }

  /**
   * Resolve (or start) a mutation (`POST`/`PATCH`/`PUT`) for a resource, resolving its
   * URL/permission variant the same way `ensure()` resolves `GET`'s, then purging the affected
   * resource's cached `GET` `Request`(s) on success.
   *
   * @description Always fires its own HTTP request — unlike `ensure()`, a mutation never attaches
   *   to, or is served from, another in-flight/settled `Request`, since a write must never be
   *   silently skipped or merged with an unrelated caller's write.
   * @param {object} args - Arguments.
   * @param {string} args.componentName - Name of the component/controller triggering the
   *   mutation, attached to the request's debug log (see {@link RequestStoreLogging}).
   * @param {string} args.resource - Resource name (`'pc'`, `'npc'`, etc.) whose cache is purged
   *   on success, in addition to any resource listed in the resolved config's own `purge` list.
   * @param {string} args.method - HTTP method (`'POST'`, `'PATCH'`, or `'PUT'`).
   * @param {string} args.quantityType - The `resourceConfig` quantity-type key to resolve the
   *   mutation's `{regular, private}` variant pair from (e.g. `'single'`, `'collection'`).
   * @param {object} [args.params] - Concrete params (`gameSlug`, `id`, etc.) the configured
   *   `path` builder needs.
   * @param {object} [args.query] - Query/filters, only used for the debug log.
   * @param {object} [args.body] - Fields to serialize as the JSON request body.
   * @param {string} [args.variantName] - When given (`'regular'` or `'private'`), forces that
   *   variant instead of resolving it from the live-permissions check — used when the caller has
   *   already decided which variant applies (e.g. from an already-loaded character's `can_edit`)
   *   and a fresh, possibly-stale-relative-to-that-decision permission re-check would risk
   *   picking a different variant than the payload was built for.
   * @returns {Promise<Response>} Resolves to the raw fetch response, the same contract every
   *   other client in this codebase already returns (`response.ok`, `response.status`,
   *   `response.json()`).
   */
  static mutate({
    componentName, resource, method, quantityType, params = {}, query = {}, body, variantName,
  }) {
    const config = resourceConfig.get(method, resource, quantityType);

    if (!config) {
      return Promise.reject(new Error(`RequestStore.mutate: no ${method} config for ${resource}.${quantityType}`));
    }

    const requestPromise = RequestStore.#resolveMutationVariant(config, resource, quantityType, params, variantName)
      .then((variant) => mutationClient.mutate(method, variant.path(params), body, AuthStorage.getToken())
        .then((response) => RequestStore.#purgeAfterMutation(response, resource, variant)));

    return RequestStoreLogging.wrap(componentName, method, resource, quantityType, params, query, requestPromise);
  }

  /**
   * Resolve a resource's URL for a method/quantity-type/params combination, the same way
   * `ensure()`/`mutate()` do, without firing any request — used by callers whose actual HTTP
   * dispatch does not go through this store (e.g. the two-step photo upload saga, which uses its
   * own client), so they don't need to hand-build the path themselves.
   *
   * @param {object} args - Arguments.
   * @param {string} args.resource - Resource name.
   * @param {string} args.method - HTTP method the path is configured under.
   * @param {string} args.quantityType - The `resourceConfig` quantity-type key.
   * @param {object} [args.params] - Concrete params the configured `path` builder needs.
   * @returns {Promise<string>} Resolves to the resolved path.
   */
  static resolvePath({
    resource, method, quantityType, params = {},
  }) {
    const config = resourceConfig.get(method, resource, quantityType);

    if (!config) {
      return Promise.reject(new Error(`RequestStore.resolvePath: no ${method} config for ${resource}.${quantityType}`));
    }

    return RequestStore.#resolveMutationVariant(config, resource, quantityType, params)
      .then((variant) => variant.path(params));
  }

  /**
   * Purge cached `GET` data for a resource, so the next `ensure()` call reflects a mutation that
   * just landed.
   *
   * @description Every settled `Request` held for the resource (regardless of quantity-type or
   *   params — e.g. both a character's `single` cache and the resource's `collection`/index
   *   cache) is deleted outright, since a settled entry is exactly the stale "cache" that must no
   *   longer be served. Every *ongoing* `Request` is not discarded outright — a caller is already
   *   waiting on it — instead its in-flight fetch is dropped and a new one is started via the
   *   same restart mechanic `resyncPermissions()` uses per-entry, guaranteeing the waiting caller
   *   still gets a response, and that the response is fresh.
   * @param {object} args - Arguments.
   * @param {string} args.resource - Resource name whose cached `Request`(s) should be purged.
   * @returns {void}
   */
  static purge({ resource } = {}) {
    requests.forEach((entry, key) => {
      if (entry.resource !== resource) {
        return;
      }

      if (entry.request.isOngoing()) {
        entry.request.restart();
        RequestPermissionResolvers.resolve(entry.resource, entry.quantityType, entry.params)
          .then((permissions) => entry.request.ensure({ permissions, params: entry.params, query: entry.query }));
        return;
      }

      requests.delete(key);
    });
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

  static #resolveMutationVariant(config, resource, quantityType, params, variantName) {
    if (variantName) {
      return Promise.resolve({ ...config[variantName], name: variantName });
    }

    return RequestPermissionResolvers.resolve(resource, quantityType, params)
      .then((permissions) => resolveVariant(config, permissions, params));
  }

  static #purgeAfterMutation(response, resource, variant) {
    if (response.ok) {
      RequestStore.purge({ resource });
      (variant.purge ?? []).forEach((other) => RequestStore.purge({ resource: other }));
    }

    return response;
  }
}

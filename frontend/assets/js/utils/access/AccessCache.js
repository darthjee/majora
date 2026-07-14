import AccessEvents from './AccessEvents.js';

/**
 * Generic, abort-aware in-memory async cache used internally by
 * {@link AccessStore}.
 *
 * @description Not access-specific: given a cache key and an async fetcher,
 *   dedupes concurrent calls for the same key, caches the first successful
 *   result, and falls back to a caller-supplied default (without caching the
 *   failure) when the fetcher rejects for any reason other than abort.
 *   Emits {@link AccessEvents} whenever a request settles (success or
 *   non-abort failure), so callers can react without polling.
 */
export default class AccessCache {
  #cache = new Map();

  /**
   * Resolve (or start) the cached value for a key.
   *
   * @param {string} key - Cache key.
   * @param {Function} fetcher - Called with an `AbortSignal` when no cached/pending
   *   entry exists for `key`; must return a `Promise`.
   * @param {*} defaultValue - Value resolved when `fetcher` rejects (fail-closed).
   * @returns {Promise<*>} Resolves to the cached, freshly-fetched, or default value.
   */
  ensure(key, fetcher, defaultValue) {
    const cached = this.#cache.get(key);

    if (cached) {
      return cached.status === 'ready' ? Promise.resolve(cached.data) : cached.promise;
    }

    const controller = new AbortController();
    const promise = fetcher(controller.signal)
      .then((data) => this.#settle(key, controller, promise, data))
      .catch((error) => this.#fail(key, controller, promise, defaultValue, error));

    this.#cache.set(key, { status: 'pending', data: undefined, promise, controller });
    return promise;
  }

  /**
   * Synchronously read the currently cached value for a key, without triggering a fetch.
   *
   * @param {string} key - Cache key.
   * @param {*} defaultValue - Value returned while unresolved or absent.
   * @returns {*} The cached value, or `defaultValue`.
   */
  read(key, defaultValue) {
    const entry = this.#cache.get(key);

    if (!entry || entry.status !== 'ready') {
      return defaultValue;
    }

    return entry.data;
  }

  /**
   * Abort every in-flight request and clear every cached entry.
   *
   * @returns {void}
   */
  reset() {
    this.#cache.forEach((entry) => entry.controller.abort());
    this.#cache = new Map();
  }

  #settle(key, controller, promise, data) {
    if (this.#cache.get(key)?.controller !== controller) {
      return data;
    }

    this.#cache.set(key, { status: 'ready', data, promise, controller });
    AccessEvents.emit({ key });
    return data;
  }

  #fail(key, controller, promise, defaultValue, error) {
    if (this.#cache.get(key)?.controller !== controller) {
      return defaultValue;
    }

    if (error?.name === 'AbortError') {
      this.#cache.delete(key);
      return defaultValue;
    }

    this.#cache.set(key, { status: 'ready', data: defaultValue, promise, controller });
    AccessEvents.emit({ key });
    return defaultValue;
  }
}

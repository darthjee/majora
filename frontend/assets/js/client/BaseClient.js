import SKIP_CACHE_ENDPOINTS from './config/skipCacheEndpoints.js';
import SKIP_CACHE_SUFFIXES from './config/skipCacheSuffixes.js';
import ActivityTracker from '../utils/ActivityTracker.js';
import ACTIVITY_ENDPOINT_PREFIXES from '../utils/config/activityEndpoints.js';

/**
 * Base HTTP client providing a shared `fetch` wrapper that automatically
 * adds the `X-Skip-Cache` header for configured endpoints and path suffixes,
 * and registers user activity for qualifying requests.
 */
export default class BaseClient {
  /**
   * Perform an HTTP request, adding `X-Skip-Cache: 1` automatically when
   * the request path matches a configured skip-cache endpoint or ends with
   * a configured skip-cache suffix. Also registers user activity for
   * POST/PATCH/DELETE requests and allowlisted GET endpoints.
   *
   * @param {string} path - Request path, optionally including a query string.
   * @param {object} options - Request options.
   * @param {string} [options.method] - HTTP method to use.
   * @param {object} [options.headers] - Headers to send with the request.
   * @param {*} [options.body] - Request body, already serialized by the caller.
   * @param {AbortSignal} [options.signal] - Optional abort signal for the request.
   * @returns {Promise<Response>} The fetch response.
   */
  async request(path, { method = 'GET', headers = {}, body, signal } = {}) {
    const pathname = path.split('?')[0];
    const finalHeaders = { ...headers };

    if (this.#shouldSkipCache(pathname)) {
      finalHeaders['X-Skip-Cache'] = '1';
    }

    if (this.#shouldRegisterActivity(method, pathname)) {
      ActivityTracker.register();
    }

    const fetchOptions = { method, headers: finalHeaders, body };

    if (signal !== undefined) {
      fetchOptions.signal = signal;
    }

    return fetch(path, fetchOptions);
  }

  /**
   * Returns true when the request path requires the X-Skip-Cache header.
   *
   * @param {string} pathname - The request pathname without query string.
   * @returns {boolean} Whether the X-Skip-Cache header should be added.
   */
  #shouldSkipCache(pathname) {
    const matchesSuffix = [...SKIP_CACHE_SUFFIXES].some(
      (suffix) => pathname.endsWith(suffix)
    );
    return SKIP_CACHE_ENDPOINTS.has(pathname) || matchesSuffix;
  }

  /**
   * Returns true when the request should register user activity in ActivityTracker.
   * Applies to all write methods and allowlisted GET endpoints.
   *
   * @param {string} method - The HTTP method (GET, POST, PATCH, DELETE, etc.).
   * @param {string} pathname - The request pathname without query string.
   * @returns {boolean} Whether ActivityTracker.register() should be called.
   */
  #shouldRegisterActivity(method, pathname) {
    if (method === 'POST' || method === 'PATCH' || method === 'DELETE') {
      return true;
    }
    return method === 'GET' && [...ACTIVITY_ENDPOINT_PREFIXES].some(
      (prefix) => pathname.startsWith(prefix)
    );
  }
}

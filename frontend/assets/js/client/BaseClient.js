import SKIP_CACHE_ENDPOINTS from './config/skipCacheEndpoints.js';
import SKIP_CACHE_SUFFIXES from './config/skipCacheSuffixes.js';

/**
 * Base HTTP client providing a shared `fetch` wrapper that automatically
 * adds the `X-Skip-Cache` header for configured endpoints and path suffixes.
 */
export default class BaseClient {
  /**
   * Perform an HTTP request, adding `X-Skip-Cache: 1` automatically when
   * the request path matches a configured skip-cache endpoint or ends with
   * a configured skip-cache suffix.
   *
   * @param {string} path - Request path, optionally including a query string.
   * @param {object} options - Request options.
   * @param {string} [options.method] - HTTP method to use.
   * @param {object} [options.headers] - Headers to send with the request.
   * @param {*} [options.body] - Request body, already serialized by the caller.
   * @returns {Promise<Response>} The fetch response.
   */
  async request(path, { method = 'GET', headers = {}, body } = {}) {
    const pathname = path.split('?')[0];
    const finalHeaders = { ...headers };

    const matchesSuffix = [...SKIP_CACHE_SUFFIXES].some(
      (suffix) => pathname.endsWith(suffix)
    );

    if (SKIP_CACHE_ENDPOINTS.has(pathname) || matchesSuffix) {
      finalHeaders['X-Skip-Cache'] = '1';
    }

    return fetch(path, {
      method,
      headers: finalHeaders,
      body,
    });
  }
}

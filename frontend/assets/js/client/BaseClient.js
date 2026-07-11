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
   * Perform an HTTP request, adding `X-Skip-Cache: true` automatically when
   * the HTTP method is POST, PATCH, or DELETE, or when the request path
   * matches a configured skip-cache endpoint or ends with a configured
   * skip-cache suffix. Also registers user activity for POST/PATCH/DELETE
   * requests and allowlisted GET endpoints.
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

    if (this.#shouldSkipCache(method, pathname)) {
      finalHeaders['X-Skip-Cache'] = 'true';
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
   * Returns true when the request requires the X-Skip-Cache: true header.
   * Always returns true for POST, PATCH, and DELETE methods. For GET
   * requests, returns true when the pathname matches a configured
   * skip-cache endpoint or ends with a configured skip-cache suffix.
   *
   * @param {string} method - The HTTP method (GET, POST, PATCH, DELETE, etc.).
   * @param {string} pathname - The request pathname without query string.
   * @returns {boolean} Whether the X-Skip-Cache header should be added.
   */
  #shouldSkipCache(method, pathname) {
    if (method === 'POST' || method === 'PATCH' || method === 'DELETE') {
      return true;
    }
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

  /**
   * Build the shared `Accept`/`Authorization` header set used by JSON
   * requests, merging in any caller-supplied extra headers (e.g.
   * `X-Skip-Cache`). `Authorization` is only added when a token is given.
   *
   * @param {string|null} token - Authentication token, if any.
   * @param {object} [extraHeaders] - Additional headers to merge in.
   * @returns {object} Header object for a JSON request.
   */
  buildHeaders(token, extraHeaders = {}) {
    return {
      Accept: 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...extraHeaders,
    };
  }

  /**
   * Perform a GET request with JSON `Accept`/`Authorization` headers.
   *
   * @param {string} path - Request path, optionally including a query string.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} [extraHeaders] - Additional headers to merge in.
   * @param {AbortSignal} [signal] - Optional abort signal for the request.
   * @returns {Promise<Response>} The fetch response.
   */
  getJson(path, token, extraHeaders = {}, signal) {
    return this.request(path, { headers: this.buildHeaders(token, extraHeaders), signal });
  }

  /**
   * Perform a POST request with a JSON body and `Content-Type` header.
   *
   * @param {string} path - Request path.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} fields - Fields to serialize as the JSON request body.
   * @param {object} [extraHeaders] - Additional headers to merge in.
   * @returns {Promise<Response>} The fetch response.
   */
  postJson(path, token, fields, extraHeaders = {}) {
    return this.#writeJson('POST', path, token, fields, extraHeaders);
  }

  /**
   * Perform a PATCH request with a JSON body and `Content-Type` header.
   *
   * @param {string} path - Request path.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} fields - Fields to serialize as the JSON request body.
   * @param {object} [extraHeaders] - Additional headers to merge in.
   * @returns {Promise<Response>} The fetch response.
   */
  patchJson(path, token, fields, extraHeaders = {}) {
    return this.#writeJson('PATCH', path, token, fields, extraHeaders);
  }

  /**
   * Perform a JSON write request (POST/PATCH), serializing the given fields
   * as the request body and adding the `Content-Type` header.
   *
   * @param {string} method - HTTP method to use (POST or PATCH).
   * @param {string} path - Request path.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} fields - Fields to serialize as the JSON request body.
   * @param {object} extraHeaders - Additional headers to merge in.
   * @returns {Promise<Response>} The fetch response.
   */
  #writeJson(method, path, token, fields, extraHeaders) {
    return this.request(path, {
      method,
      headers: { ...this.buildHeaders(token, extraHeaders), 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
  }
}

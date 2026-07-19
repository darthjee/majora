import SKIP_CACHE_ENDPOINTS from './config/skipCacheEndpoints.js';
import SKIP_CACHE_SUFFIXES from './config/skipCacheSuffixes.js';
import ActivityTracker from '../utils/logging/ActivityTracker.js';
import ACTIVITY_ENDPOINT_PREFIXES from '../utils/config/activityEndpoints.js';
import ResilientRequest from './ResilientRequest.js';

const DEFAULT_TIMEOUT_MS = 5000;

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
   * @param {AbortSignal} [options.signal] - Optional abort signal for the request. When
   *   omitted, a default 5-second timeout signal is generated for every attempt.
   * @param {boolean} [options.retry] - Whether transient failures (a `502` response or a
   *   timeout) should be retried indefinitely via {@link ResilientRequest}. Defaults to
   *   `true` for GET requests and `false` for every other method, to avoid duplicating
   *   non-idempotent writes.
   * @returns {Promise<Response>} The fetch response.
   */
  async request(path, { method = 'GET', headers = {}, body, signal, retry = method === 'GET' } = {}) {
    const [pathname, search = ''] = path.split('?');
    const finalHeaders = { ...headers };

    if (this.#shouldSkipCache(method, pathname, search)) {
      finalHeaders['X-Skip-Cache'] = 'true';
    }

    if (this.#shouldRegisterActivity(method, pathname)) {
      ActivityTracker.register();
    }

    const attempt = () => fetch(path, {
      method,
      headers: finalHeaders,
      body,
      signal: signal !== undefined ? signal : AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });

    if (!retry) {
      return attempt();
    }

    return new ResilientRequest(attempt).run();
  }

  /**
   * Returns true when the request requires the X-Skip-Cache: true header.
   * Always returns true for POST, PATCH, and DELETE methods. For GET
   * requests to a `/permissions.json` path, this is role-aware: it returns
   * true only when no `role` query param is present (a role-simulated
   * permissions request is cacheable and must not skip cache). For every
   * other GET request, returns true when the pathname matches a configured
   * skip-cache endpoint or ends with a configured skip-cache suffix
   * (`/access.json` unconditionally, among others).
   *
   * @param {string} method - The HTTP method (GET, POST, PATCH, DELETE, etc.).
   * @param {string} pathname - The request pathname without query string.
   * @param {string} search - The request query string, without the leading `?`.
   * @returns {boolean} Whether the X-Skip-Cache header should be added.
   */
  #shouldSkipCache(method, pathname, search) {
    if (method === 'POST' || method === 'PATCH' || method === 'DELETE') {
      return true;
    }
    if (pathname.endsWith('/permissions.json')) {
      return !new URLSearchParams(search).has('role');
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
   * Build a query string that serializes each role as a repeated `role=`
   * param (e.g. `?role=dm&role=player`), used by `fetch*Permissions` methods
   * to request role-simulated permissions instead of the requester's own
   * identity.
   *
   * @param {string[]} [roles] - Role names to serialize.
   * @returns {string} Query string including the leading `?`, or `''` when `roles` is empty.
   */
  buildRoleQuery(roles = []) {
    if (!roles || roles.length === 0) {
      return '';
    }

    const params = new URLSearchParams();

    roles.forEach((role) => params.append('role', role));

    return `?${params.toString()}`;
  }

  /**
   * Build a `URLSearchParams` from ordered `[key, value]` entries, including only entries
   * whose value is defined (i.e. not `undefined`, `null`, or an empty string).
   *
   * @param {Array<[string, string|number]>} entries - Query entries as `[key, value]` pairs,
   *   in the order they should appear in the resulting query string.
   * @returns {URLSearchParams} Query params with blank/undefined/null entries omitted.
   */
  buildQuery(entries) {
    const params = new URLSearchParams();

    entries.forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value);
      }
    });

    return params;
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
   * Perform a PUT request with a JSON body and `Content-Type` header.
   *
   * @param {string} path - Request path.
   * @param {string|null} token - Authentication token, if any.
   * @param {object} fields - Fields to serialize as the JSON request body.
   * @param {object} [extraHeaders] - Additional headers to merge in.
   * @returns {Promise<Response>} The fetch response.
   */
  putJson(path, token, fields, extraHeaders = {}) {
    return this.#writeJson('PUT', path, token, fields, extraHeaders);
  }

  /**
   * Perform a JSON write request (POST/PATCH/PUT), serializing the given fields
   * as the request body and adding the `Content-Type` header.
   *
   * @param {string} method - HTTP method to use (POST, PATCH, or PUT).
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

  /**
   * Parse a response body as JSON when the response is ok, otherwise reject
   * with an `Error` carrying the given message.
   *
   * @param {Response} response - The fetch response to parse.
   * @param {string} message - Error message used when the response is not ok.
   * @returns {Promise<object>} The parsed JSON body.
   */
  static parseJsonOrReject(response, message) {
    return response.ok ? response.json() : Promise.reject(new Error(message));
  }
}

import HashRouteResolver from '../utils/routing/HashRouteResolver.js';
import HashQueryParams from '../utils/routing/HashQueryParams.js';
import getCurrentHash from '../utils/routing/currentHash.js';
import parsePositiveInt from '../utils/parsePositiveInt.js';
import BaseClient from './BaseClient.js';

/**
 * Generic HTTP client used by page controllers.
 */
export default class GenericClient extends BaseClient {
  #hashProvider;

  #resolver;

  /**
   * Create a generic client.
   *
   * @param {Function} hashProvider - Function returning current hash.
   */
  constructor(hashProvider = getCurrentHash) {
    super();
    this.#hashProvider = hashProvider;
    this.#resolver = new HashRouteResolver(hashProvider);
  }

  /**
   * Return the current hash.
   *
   * @returns {string} Current hash value.
   */
  currentHash() {
    return this.#hashProvider();
  }

  /**
   * Fetch JSON with hash query params.
   *
   * @param {string} path - Request path.
   * @returns {Promise<object>} Parsed JSON.
   */
  async fetch(path) {
    const url = this.#buildUrl(path, HashQueryParams.parse(this.currentHash()));
    return this.#request(url, { headers: this.buildHeaders(null) }, path);
  }

  /**
   * Fetch JSON index and pagination info.
   *
   * @param {string} path - Request path.
   * @param {object} [extraParams] - Additional query params merged over pagination params
   *   (e.g. NPC list filters). Blank/undefined/null values are ignored. Defaults to none, so
   *   other callers of `fetchIndex` are unaffected.
   * @returns {Promise<object>} Data and pagination metadata.
   */
  async fetchIndex(path, extraParams = {}) {
    const url = this.#buildUrl(path, this.#buildIndexParams(extraParams));
    const response = await this.request(url, { headers: this.buildHeaders(null) });

    if (!response.ok) {
      throw new Error(`Request failed for ${path}`);
    }

    return {
      data: await response.json(),
      pagination: {
        page: parsePositiveInt(response.headers.get('page'), 1),
        pages: parsePositiveInt(response.headers.get('pages'), 1),
        perPage: parsePositiveInt(response.headers.get('per_page'), 10),
      },
    };
  }

  /**
   * Send JSON payload through POST.
   *
   * @param {string} path - Request path.
   * @param {object} body - Request body.
   * @returns {Promise<object>} Parsed JSON.
   */
  async post(path, body) {
    return this.#request(path, {
      method: 'POST',
      headers: { ...this.buildHeaders(null), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, path);
  }

  /**
   * Send JSON payload through PATCH.
   *
   * @param {string} path - Request path.
   * @param {object} body - Request body.
   * @returns {Promise<object>} Parsed JSON.
   */
  async patch(path, body) {
    return this.#request(path, {
      method: 'PATCH',
      headers: { ...this.buildHeaders(null), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, path);
  }

  /**
   * Merge extra query params over the resolver's pagination params.
   *
   * @description An array value (e.g. an STL model filters bar's multi-value `race`/`roles`/
   *   `source`/`collection`/`tags` field) is serialized as one repeated query entry per array
   *   element (`params.append(key, v)` for each, skipping blank/undefined/null entries) instead
   *   of a single `.set()` call, which cannot represent more than one value per key. A scalar
   *   value keeps the existing `.set()` behavior, unaffected by this branch.
   * @param {object} extraParams - Additional query params to merge in.
   * @returns {URLSearchParams} Merged query params.
   */
  #buildIndexParams(extraParams) {
    const params = this.#resolver.getPaginationParams();

    Object.entries(extraParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        params.delete(key);
        value
          .filter((v) => v !== undefined && v !== null && v !== '')
          .forEach((v) => params.append(key, v));
        return;
      }

      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value);
      }
    });

    return params;
  }

  /**
   * Build a URL with optional query params.
   *
   * @param {string} path - Path prefix.
   * @param {URLSearchParams} params - Query params.
   * @returns {string} Built URL.
   */
  #buildUrl(path, params) {
    const query = params.toString();
    return query ? `${path}?${query}` : path;
  }

  /**
   * Execute an HTTP request and parse JSON.
   *
   * @param {string} path - Full request path.
   * @param {object} options - Fetch options.
   * @param {string} originalPath - Logical path for error message.
   * @returns {Promise<object>} Parsed JSON.
   */
  async #request(path, options, originalPath) {
    const response = await this.request(path, options);

    if (!response.ok) {
      throw new Error(`Request failed for ${originalPath}`);
    }

    return response.json();
  }
}

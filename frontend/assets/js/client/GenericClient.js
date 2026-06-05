import HashRouteResolver from '../utils/HashRouteResolver.js';
import hashQueryParams from '../utils/hashQueryParams.js';

/**
 * Generic HTTP client used by page controllers.
 */
export default class GenericClient {
  #hashProvider;

  #resolver;

  /**
   * Create a generic client.
   *
   * @param {Function} hashProvider - Function returning current hash.
   */
  constructor(hashProvider = () => (typeof window === 'undefined' ? '' : window.location.hash)) {
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
    const url = this.#buildUrl(path, hashQueryParams(this.currentHash()));
    return this.#request(url, { headers: { Accept: 'application/json' } }, path);
  }

  /**
   * Fetch JSON index and pagination info.
   *
   * @param {string} path - Request path.
   * @returns {Promise<object>} Data and pagination metadata.
   */
  async fetchIndex(path) {
    const url = this.#buildUrl(path, this.#resolver.getPaginationParams());
    const response = await fetch(url, { headers: { Accept: 'application/json' } });

    if (!response.ok) {
      throw new Error(`Request failed for ${path}`);
    }

    return {
      data: await response.json(),
      pagination: {
        page: this.#parseInt(response.headers.get('page'), 1),
        pages: this.#parseInt(response.headers.get('pages'), 1),
        perPage: this.#parseInt(response.headers.get('per_page'), 10),
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
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
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
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, path);
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
   * Parse positive integer values.
   *
   * @param {string|null} value - Raw value.
   * @param {number} fallback - Fallback value.
   * @returns {number} Parsed number.
   */
  #parseInt(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
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
    const response = await fetch(path, options);

    if (!response.ok) {
      throw new Error(`Request failed for ${originalPath}`);
    }

    return response.json();
  }
}

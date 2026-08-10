/**
 * In-memory storage for the auth token.
 * The token is reset on page refresh and re-hydrated from the session via checkStatus().
 *
 * @type {string|null}
 */
let _token = null;

/**
 * In-memory storage for the cache token, sent as the `X-Cache-Token` header on every
 * request once known. Mirrors the auth token's lifecycle exactly: reset on page refresh
 * and re-hydrated from the session via checkStatus().
 *
 * @type {string|null}
 */
let _cacheToken = null;

/**
 * Helper for persisting the auth token in memory for the lifetime of the page.
 */
export default class AuthStorage {
  /**
   * Reads the in-memory auth token.
   *
   * @returns {string|null} the stored auth token, or null when unavailable.
   */
  static getToken() {
    return _token;
  }

  /**
   * Stores the given auth token in memory.
   *
   * @param {string} token - the auth token to store.
   * @returns {void}
   */
  static setToken(token) {
    _token = token;
  }

  /**
   * Removes the in-memory auth token.
   *
   * @returns {void}
   */
  static clearToken() {
    _token = null;
  }

  /**
   * Reads the in-memory cache token.
   *
   * @returns {string|null} the stored cache token, or null when unavailable.
   */
  static getCacheToken() {
    return _cacheToken;
  }

  /**
   * Stores the given cache token in memory.
   *
   * @param {string} cacheToken - the cache token to store.
   * @returns {void}
   */
  static setCacheToken(cacheToken) {
    _cacheToken = cacheToken;
  }

  /**
   * Removes the in-memory cache token.
   *
   * @returns {void}
   */
  static clearCacheToken() {
    _cacheToken = null;
  }
}

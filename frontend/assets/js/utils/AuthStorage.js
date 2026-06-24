/**
 * In-memory storage for the auth token.
 * The token is reset on page refresh and re-hydrated from the session via checkStatus().
 *
 * @type {string|null}
 */
let _token = null;

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
}

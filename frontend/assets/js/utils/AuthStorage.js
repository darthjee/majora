/**
 * Helper for persisting the auth token in `localStorage`, guarding
 * against environments where `localStorage` is unavailable (e.g. SSR/tests).
 */
export default class AuthStorage {
  /**
   * Reads the persisted auth token.
   *
   * @returns {string|null} the stored auth token, or null when unavailable.
   */
  static getToken() {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.authToken ?? null;
  }

  /**
   * Persists the given auth token.
   *
   * @param {string} token - the auth token to store.
   * @returns {void}
   */
  static setToken(token) {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.authToken = token;
  }

  /**
   * Removes the persisted auth token.
   *
   * @returns {void}
   */
  static clearToken() {
    if (typeof localStorage === 'undefined') {
      return;
    }

    delete localStorage.authToken;
  }
}

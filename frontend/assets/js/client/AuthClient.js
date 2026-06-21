/**
 * HTTP client for authentication requests (login, logout, status).
 */
export default class AuthClient {
  /**
   * Submits a login request with the given credentials.
   *
   * @param {string} username - Username to authenticate with.
   * @param {string} password - Password to authenticate with.
   * @returns {Promise<Response>} fetch response from the login endpoint.
   */
  login(username, password) {
    return fetch('/users/login.json', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Skip-Cache': '1',
      },
      body: JSON.stringify({ username, password }),
    });
  }

  /**
   * Submits a logout request for the given auth token.
   *
   * @param {string} token - Authentication token to invalidate.
   * @returns {Promise<Response>} fetch response from the logout endpoint.
   */
  logout(token) {
    return fetch('/users/logout.json', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Skip-Cache': '1',
        Authorization: `Token ${token}`,
      },
    });
  }

  /**
   * Fetches the current authentication status for the given token.
   *
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<Response>} fetch response from the status endpoint.
   */
  status(token) {
    return fetch('/users/status.json', {
      headers: {
        Accept: 'application/json',
        'X-Skip-Cache': '1',
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
    });
  }

  /**
   * Requests a test email to be sent to the authenticated user.
   *
   * @param {string} token - Authentication token for the requesting user.
   * @returns {Promise<Response>} fetch response from the test-email endpoint.
   */
  sendTestEmail(token) {
    return fetch('/users/test-email.json', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Token ${token}`,
      },
    });
  }
}

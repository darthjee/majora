import BaseClient from './BaseClient.js';

/**
 * HTTP client for authentication requests (login, logout, status).
 */
export default class AuthClient extends BaseClient {
  /**
   * Submits a login request with the given credentials.
   *
   * @param {string} username - Username to authenticate with.
   * @param {string} password - Password to authenticate with.
   * @returns {Promise<Response>} fetch response from the login endpoint.
   */
  login(username, password) {
    return this.request('/users/login.json', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
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
    return this.request('/users/logout.json', {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
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
    return this.request('/users/status.json', {
      headers: {
        Accept: 'application/json',
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
    return this.request('/users/test-email.json', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Token ${token}`,
      },
    });
  }

  /**
   * Requests a password recovery email for the given address.
   *
   * @param {string} email - Email address to send the recovery link to.
   * @returns {Promise<Response>} fetch response from the recover endpoint.
   */
  recoverPassword(email) {
    return this.request('/users/recover.json', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Submits a new password using a password recovery token.
   *
   * @param {string} token - Password recovery token.
   * @param {string} password - New password to set.
   * @returns {Promise<Response>} fetch response from the reset-password endpoint.
   */
  resetPassword(token, password) {
    return this.request('/users/reset-password.json', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
  }

  /**
   * Submits a registration request for a new user account.
   *
   * @param {string} name - Name to register, used as the username.
   * @param {string} email - Email address to register.
   * @param {string} password - Password to register.
   * @param {string} passwordConfirmation - Confirmation of the password.
   * @returns {Promise<Response>} fetch response from the register endpoint.
   */
  register(name, email, password, passwordConfirmation) {
    return this.request('/users/register.json', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      }),
    });
  }

  /**
   * Persists the authenticated user's favorite language preference.
   *
   * @param {string} token - Authentication token for the requesting user.
   * @param {string} language - Language code to set as the favorite.
   * @returns {Promise<Response>} fetch response from the language endpoint.
   */
  setLanguagePreference(token, language) {
    return this.request('/users/language.json', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ language }),
    });
  }
}

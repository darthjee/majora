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
    return this.postJson('/users/login.json', null, { username, password });
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
      headers: { ...this.buildHeaders(token), 'Content-Type': 'application/json' },
    });
  }

  /**
   * Fetches the current authentication status for the given token.
   *
   * @param {string|null} token - Authentication token, if any.
   * @param {AbortSignal} [signal] - Optional abort signal for the request.
   * @returns {Promise<Response>} fetch response from the status endpoint.
   */
  status(token, signal) {
    return this.getJson('/users/status.json', token, {}, signal);
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
      headers: this.buildHeaders(token),
    });
  }

  /**
   * Requests a password recovery email for the given address.
   *
   * @param {string} email - Email address to send the recovery link to.
   * @returns {Promise<Response>} fetch response from the recover endpoint.
   */
  recoverPassword(email) {
    return this.postJson('/users/recover.json', null, { email });
  }

  /**
   * Submits a new password using a password recovery token.
   *
   * @param {string} token - Password recovery token.
   * @param {string} password - New password to set.
   * @returns {Promise<Response>} fetch response from the reset-password endpoint.
   */
  resetPassword(token, password) {
    return this.postJson('/users/reset-password.json', null, { token, password });
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
    return this.postJson('/users/register.json', null, {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
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
    return this.postJson('/users/language.json', token, { language });
  }

  /**
   * Fetches the authenticated user's own account details.
   *
   * @param {string} token - Authentication token for the requesting user.
   * @returns {Promise<Response>} fetch response from the account endpoint.
   */
  fetchAccount(token) {
    return this.getJson('/users/account.json', token);
  }

  /**
   * Updates the authenticated user's own account details.
   *
   * @param {string} token - Authentication token for the requesting user.
   * @param {{name: string, firstName: string, lastName: string, email: string,
   *   password: (string|undefined), passwordConfirmation: (string|undefined)}} account -
   *   Account field values.
   * @returns {Promise<Response>} fetch response from the account endpoint.
   */
  updateAccount(token, { name, firstName, lastName, email, password, passwordConfirmation }) {
    return this.patchJson('/users/account.json', token, {
      name,
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
  }
}

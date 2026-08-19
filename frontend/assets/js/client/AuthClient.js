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
   * Fetches the header's route-independent identity fields (`loggedIn`, `isSuperUser`,
   * `isStaff`, `pendingApproval`, `cacheToken`) in a single request.
   *
   * @param {string|null} token - Authentication token, if any.
   * @param {AbortSignal} [signal] - Optional abort signal for the request.
   * @returns {Promise<Response>} fetch response from the header-status endpoint.
   */
  headerStatus(token, signal) {
    return this.getJson('/users/header_status.json', token, {}, signal);
  }

  /**
   * Requests a test email to be sent to the authenticated user.
   *
   * @param {string} token - Authentication token for the requesting user.
   * @returns {Promise<Response>} fetch response from the test-email endpoint.
   */
  sendTestEmail(token) {
    return this.request('/staff/test-email.json', {
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
   * @param {string} displayName - Display name to register, shown to other users.
   * @param {string} email - Email address to register.
   * @param {string} password - Password to register.
   * @param {string} passwordConfirmation - Confirmation of the password.
   * @returns {Promise<Response>} fetch response from the register endpoint.
   */
  register(name, displayName, email, password, passwordConfirmation) {
    return this.postJson('/users/register.json', null, {
      name,
      display_name: displayName,
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
    return this.postJson('/account/language.json', token, { language });
  }

  /**
   * Fetches the authenticated user's own account details.
   *
   * @param {string} token - Authentication token for the requesting user.
   * @returns {Promise<Response>} fetch response from the account endpoint.
   */
  fetchAccount(token) {
    return this.getJson('/account/account.json', token);
  }

  /**
   * Updates the authenticated user's own account details.
   *
   * @param {string} token - Authentication token for the requesting user.
   * @param {{name: string, displayName: string, firstName: string, lastName: string,
   *   email: string, password: (string|undefined), passwordConfirmation: (string|undefined)}}
   *   account - Account field values.
   * @returns {Promise<Response>} fetch response from the account endpoint.
   */
  updateAccount(token, {
    name, displayName, firstName, lastName, email, password, passwordConfirmation,
  }) {
    return this.patchJson('/account/account.json', token, {
      name,
      display_name: displayName,
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
  }

  /**
   * Creates a passwordless device-authorization login request for the given
   * username, pre-login (no auth token involved). Per the shared contract,
   * the response shape/status is identical whether or not the username
   * matches a real user (enumeration-safe).
   *
   * @param {string} username - Username to request a device-authorized login for.
   * @returns {Promise<Response>} fetch response carrying `{uuid, expiration, token}`.
   */
  createAuthorizationRequest(username) {
    return this.postJson('/users/authorization_requests.json', null, { username });
  }

  /**
   * Polls the status of a pending device-authorization request, pre-login,
   * authenticating the poll itself with the request's own bearer token
   * (rather than a login token) via the `X-Authorize-Token` header.
   *
   * @param {string} uuid - Authorization request uuid, from {@link createAuthorizationRequest}.
   * @param {string} token - Opaque bearer token for this request, from {@link createAuthorizationRequest}.
   * @param {AbortSignal} [signal] - Optional abort signal for the request.
   * @returns {Promise<Response>} fetch response from the authorization-request polling endpoint;
   *   a `202` response carries a real login `token`, to be stored exactly like a normal login.
   */
  pollAuthorizationRequest(uuid, token, signal) {
    return this.getJson(
      `/users/authorization_requests/${uuid}.json`,
      null,
      { 'X-Authorize-Token': token },
      signal
    );
  }

  /**
   * Fetches the authenticated user's own paginated authorization requests, newest first.
   *
   * @param {string} token - Authentication token for the requesting user.
   * @param {{page: (string|number|undefined), perPage: (string|number|undefined)}} [params] -
   *   Pagination params, forwarded as `page`/`per_page` query params when present.
   * @returns {Promise<Response>} fetch response from the account authorization-requests endpoint.
   */
  listAuthorizationRequests(token, { page, perPage } = {}) {
    const query = this.buildQuery([['page', page], ['per_page', perPage]]).toString();

    return this.getJson(`/account/authorization_requests.json${query ? `?${query}` : ''}`, token);
  }

  /**
   * Denies a pending authorization request belonging to the authenticated user.
   *
   * @param {string} token - Authentication token for the requesting user.
   * @param {string} uuid - Authorization request uuid to deny.
   * @returns {Promise<Response>} fetch response from the deny endpoint.
   */
  denyAuthorizationRequest(token, uuid) {
    return this.patchJson(`/account/authorization_requests/${uuid}/deny.json`, token, {});
  }

  /**
   * Authorizes a pending authorization request belonging to the authenticated user,
   * re-authenticating with the approving user's own current password.
   *
   * @param {string} token - Authentication token for the requesting user.
   * @param {string} uuid - Authorization request uuid to authorize.
   * @param {string} password - Approving user's own current password.
   * @returns {Promise<Response>} fetch response from the authorize endpoint.
   */
  authorizeAuthorizationRequest(token, uuid, password) {
    return this.patchJson(`/account/authorization_requests/${uuid}/authorize.json`, token, { password });
  }
}

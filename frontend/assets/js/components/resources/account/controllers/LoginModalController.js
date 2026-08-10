import AuthClient from '../../../../client/AuthClient.js';
import AuthEvents from '../../../../utils/auth/AuthEvents.js';
import AuthStorage from '../../../../utils/auth/AuthStorage.js';
import AuthorizationRequestPoller from '../../../../utils/polling/AuthorizationRequestPoller.js';

/**
 * Manages login modal state and login requests, for both the password
 * `'login'` mode and the passwordless `'authorize'` (device-authorization)
 * mode.
 */
export default class LoginModalController {
  /**
   * Creates a new LoginModalController instance.
   *
   * @param {Function} setUsername - state setter for the username field.
   * @param {Function} setPassword - state setter for the password field.
   * @param {Function} setIncorrect - state setter for invalid credential errors.
   * @param {Function} setError - state setter for unexpected errors.
   * @param {Function|null} [onSuccess] - callback invoked after a successful login.
   * @param {AuthClient} [client] - HTTP client used for login/authorization requests.
   * @param {Function|null} [setRecoverySent] - state setter for the recovery-sent confirmation flag.
   * @param {Function|null} [setAuthorizeStatus] - state setter for the `'authorize'` mode's status
   *   (`null` while the username-only form is shown, otherwise `'waiting'`, `'retrying'`,
   *   `'approved'`, `'denied'`, `'expired'`, or `'error'`).
   * @param {AuthorizationRequestPoller} [poller] - poller used to track a pending
   *   device-authorization request until a terminal outcome is reached.
   */
  constructor(
    setUsername,
    setPassword,
    setIncorrect,
    setError,
    onSuccess = null,
    client = new AuthClient(),
    setRecoverySent = null,
    setAuthorizeStatus = null,
    poller = new AuthorizationRequestPoller()
  ) {
    this.setUsername = setUsername;
    this.setPassword = setPassword;
    this.setIncorrect = setIncorrect;
    this.setError = setError;
    this.onSuccess = onSuccess;
    this.client = client;
    this.setRecoverySent = setRecoverySent;
    this.setAuthorizeStatus = setAuthorizeStatus;
    this.poller = poller;
  }

  /**
   * Submits the login request using the provided credentials.
   *
   * @param {string} username - username to submit.
   * @param {string} password - password to submit.
   * @returns {Promise<void>} resolves when the request handling finishes.
   */
  async handleSubmit(username, password) {
    this.setIncorrect(false);
    this.setError(false);

    try {
      const response = await this.client.login(username, password);

      await this.#handleResponse(response);
    } catch {
      this.#handleUnexpectedError();
    }
  }

  /**
   * Submits a password recovery request for the given email address.
   *
   * Regardless of the outcome, the backend always returns a generic
   * confirmation, so this only distinguishes network-level failures.
   *
   * @param {string} email - email address to send the recovery link to.
   * @returns {Promise<void>} resolves when the request handling finishes.
   */
  async handleRecoverSubmit(email) {
    try {
      await this.client.recoverPassword(email);
    } catch {
      // Network-level failures are intentionally not surfaced: the backend
      // always returns a generic confirmation, regardless of outcome.
    } finally {
      if (typeof this.setRecoverySent === 'function') {
        this.setRecoverySent(true);
      }
    }
  }

  /**
   * Creates a device-authorization login request for the given username and
   * starts polling it, switching the `'authorize'` mode's status to
   * `'waiting'` while pending.
   *
   * @param {string} username - username to request a device-authorized login for.
   * @returns {Promise<void>} resolves when the create request handling finishes (the
   *   subsequent poll continues independently in the background).
   */
  async handleAuthorizeSubmit(username) {
    this.#setAuthorizeStatus('waiting');

    try {
      const response = await this.client.createAuthorizationRequest(username);

      if (!response.ok) {
        this.#setAuthorizeStatus('error');
        return;
      }

      const request = await response.json();

      this.poller.start(request, (event) => this.#handleAuthorizeEvent(event));
    } catch {
      this.#setAuthorizeStatus('error');
    }
  }

  /**
   * Stops any in-progress poll and resets the `'authorize'` mode back to its
   * username-only form, e.g. after a terminal outcome so the user can retry.
   *
   * @returns {void}
   */
  handleAuthorizeReset() {
    this.poller.stop();
    this.#setAuthorizeStatus(null);
  }

  /**
   * Clears the login modal form state.
   *
   * @returns {void}
   */
  handleClear() {
    this.setUsername('');
    this.setPassword('');
    this.setIncorrect(false);
    this.setError(false);

    if (typeof this.setRecoverySent === 'function') {
      this.setRecoverySent(false);
    }

    this.handleAuthorizeReset();
  }

  async #handleResponse(response) {
    if (response.ok) {
      const data = await response.json();

      this.#applySuccessLogin(data.token, data.cache_token);
      return;
    }

    this.setPassword('');

    if (response.status >= 400 && response.status < 500) {
      this.setIncorrect(true);
      return;
    }

    this.setError(true);
  }

  /**
   * Applies a successful login outcome, shared by both the password `'login'`
   * mode (see `#handleResponse`) and the `'authorize'` mode once the poller
   * observes an `'approved'` outcome (see `#handleAuthorizeEvent`): stores the
   * token exactly like any other login token, clears the form, emits the
   * auth-changed event, and invokes `onSuccess`.
   *
   * @param {string} token - Login token to store.
   * @param {string} [cacheToken] - Cache token to store, when present in the response (the
   *   `'authorize'` poll response doesn't carry one; it's re-hydrated by the status check
   *   Header runs right after the auth-changed event this method emits).
   * @returns {void}
   */
  #applySuccessLogin(token, cacheToken = null) {
    AuthStorage.setToken(token);
    AuthStorage.setCacheToken(cacheToken);
    this.handleClear();
    AuthEvents.emit(true);

    if (typeof this.onSuccess === 'function') {
      this.onSuccess();
    }
  }

  #handleAuthorizeEvent(event) {
    if (event.status === 'approved') {
      this.#setAuthorizeStatus('approved');
      this.#applySuccessLogin(event.token, event.cache_token);
      return;
    }

    if (event.status === 'open') {
      return;
    }

    this.#setAuthorizeStatus(event.status);
  }

  #setAuthorizeStatus(status) {
    if (typeof this.setAuthorizeStatus === 'function') {
      this.setAuthorizeStatus(status);
    }
  }

  #handleUnexpectedError() {
    this.setPassword('');
    this.setError(true);
  }
}

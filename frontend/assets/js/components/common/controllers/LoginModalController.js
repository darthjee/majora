import AuthClient from '../../../client/AuthClient.js';
import AuthEvents from '../../../utils/AuthEvents.js';
import AuthStorage from '../../../utils/AuthStorage.js';

/**
 * Manages login modal state and login requests.
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
   * @param {AuthClient} [client] - HTTP client used for login requests.
   * @param {Function|null} [setRecoverySent] - state setter for the recovery-sent confirmation flag.
   */
  constructor(
    setUsername,
    setPassword,
    setIncorrect,
    setError,
    onSuccess = null,
    client = new AuthClient(),
    setRecoverySent = null
  ) {
    this.setUsername = setUsername;
    this.setPassword = setPassword;
    this.setIncorrect = setIncorrect;
    this.setError = setError;
    this.onSuccess = onSuccess;
    this.client = client;
    this.setRecoverySent = setRecoverySent;
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
  }

  async #handleResponse(response) {
    if (response.ok) {
      await this.#handleSuccess(response);
      return;
    }

    this.setPassword('');

    if (response.status >= 400 && response.status < 500) {
      this.setIncorrect(true);
      return;
    }

    this.setError(true);
  }

  async #handleSuccess(response) {
    const data = await response.json();

    AuthStorage.setToken(data.token);
    this.handleClear();
    AuthEvents.emit(true);

    if (typeof this.onSuccess === 'function') {
      this.onSuccess();
    }
  }

  #handleUnexpectedError() {
    this.setPassword('');
    this.setError(true);
  }
}

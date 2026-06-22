import AuthClient from '../../../client/AuthClient.js';
import AuthEvents from '../../../utils/AuthEvents.js';
import AuthStorage from '../../../utils/AuthStorage.js';

/**
 * Controller for the register page.
 */
export default class RegisterController {
  /**
   * Create a register controller.
   *
   * @param {Function} setStatus - status setter (`'idle' | 'submitting' | 'error'`).
   * @param {AuthClient} [client] - HTTP client override.
   */
  constructor(setStatus, client = new AuthClient()) {
    this.setStatus = setStatus;
    this.client = client;
  }

  /**
   * Submits a registration request with the given form values. On
   * success, stores the returned auth token and emits the auth-changed
   * event so the header immediately reflects the logged-in state, then
   * redirects to the home page.
   *
   * @param {string} name - name to register.
   * @param {string} email - email to register.
   * @param {string} password - password to register.
   * @param {string} passwordConfirmation - confirmation of the password.
   * @returns {Promise<void>} resolves when the request handling finishes.
   */
  async handleSubmit(name, email, password, passwordConfirmation) {
    this.setStatus('submitting');

    try {
      const response = await this.client.register(name, email, password, passwordConfirmation);

      await this.#handleResponse(response);
    } catch {
      this.setStatus('error');
    }
  }

  async #handleResponse(response) {
    if (response.ok) {
      await this.#handleSuccess(response);
      return;
    }

    this.setStatus('error');
  }

  async #handleSuccess(response) {
    const data = await response.json();

    AuthStorage.setToken(data.token);
    AuthEvents.emit(true);
    this.setStatus('success');
    this.#redirectHome();
  }

  #redirectHome() {
    if (typeof window === 'undefined') {
      return;
    }

    window.location.hash = '/';
  }
}

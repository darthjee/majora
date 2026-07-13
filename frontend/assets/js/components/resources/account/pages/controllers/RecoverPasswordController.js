import AuthClient from '../../../../../client/AuthClient.js';
import HealthClient from '../../../../../client/HealthClient.js';
import HashQueryParams from '../../../../../utils/HashQueryParams.js';

/**
 * Controller for the recover-password page.
 */
export default class RecoverPasswordController {
  /**
   * Extract the password recovery token from a hash query string.
   *
   * @param {string} hash - current hash.
   * @returns {string} recovery token, or an empty string when absent.
   */
  static getRecoverPasswordTokenFromHash(hash = '') {
    return HashQueryParams.parse(hash).get('token') ?? '';
  }

  /**
   * Create a recover-password controller.
   *
   * @param {Function} setStatus - status setter (`'idle' | 'submitting' | 'success' | 'error'`).
   * @param {Function} setErrorMessage - error message setter.
   * @param {AuthClient} [client] - HTTP client override.
   * @param {HealthClient} [healthClient] - HTTP client used for readiness polling.
   */
  constructor(setStatus, setErrorMessage, client = new AuthClient(), healthClient = new HealthClient()) {
    this.setStatus = setStatus;
    this.setErrorMessage = setErrorMessage;
    this.client = client;
    this.healthClient = healthClient;
  }

  /**
   * Polls the health-check endpoint until the backend reports it is ready,
   * marking the page ready once (and only once) a `200` response is received.
   *
   * @description A `502`, any other non-2xx response, or a thrown error
   *   (including the timeout rejection from `HealthClient#check`) is treated
   *   as "not ready yet": the check is retried after `delayMs`. Polling stops
   *   as soon as `cancelToken.cancelled` is set, so a pending retry never
   *   calls `setReady` after the caller has unmounted.
   * @param {Function} setReady - state setter invoked with `true` once ready.
   * @param {number} [delayMs=2000] - delay between retries, in milliseconds.
   * @param {{cancelled: boolean}} [cancelToken] - cancellation flag shared with the caller.
   * @returns {Promise<void>} resolves once ready or once cancelled.
   */
  async waitUntilReady(setReady, delayMs = 2000, cancelToken = { cancelled: false }) {
    while (!cancelToken.cancelled) {
      const ready = await this.#checkReady();

      if (cancelToken.cancelled) {
        return;
      }

      if (ready) {
        setReady(true);
        return;
      }

      await RecoverPasswordController.#wait(delayMs);
    }
  }

  async #checkReady() {
    try {
      const response = await this.healthClient.check();

      return response.status === 200;
    } catch {
      return false;
    }
  }

  static #wait(delayMs) {
    return new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  /**
   * Submits a password reset request after validating the password
   * confirmation matches client-side.
   *
   * This client-side check is a UX convenience only; the server remains
   * the source of truth for token validity and password rules.
   *
   * @param {string} token - password recovery token.
   * @param {string} password - new password.
   * @param {string} confirmPassword - confirmation of the new password.
   * @returns {Promise<void>} resolves when the request handling finishes.
   */
  async handleSubmit(token, password, confirmPassword) {
    this.setErrorMessage('');

    if (password !== confirmPassword) {
      this.setStatus('error');
      this.setErrorMessage('Passwords do not match.');
      return;
    }

    this.setStatus('submitting');

    try {
      const response = await this.client.resetPassword(token, password);

      await this.#handleResponse(response);
    } catch {
      this.setStatus('error');
      this.setErrorMessage('An unexpected error occurred, please try again later.');
    }
  }

  async #handleResponse(response) {
    if (response.ok) {
      this.setStatus('success');
      return;
    }

    const data = await response.json().catch(() => ({}));

    this.setStatus('error');
    this.setErrorMessage(data.error ?? 'Unable to reset password, please try again.');
  }
}

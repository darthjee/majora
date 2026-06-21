import AuthClient from '../../../client/AuthClient.js';

/**
 * Extract the password recovery token from a hash query string.
 *
 * @param {Function} hashQueryParams - hashQueryParams helper.
 * @param {string} hash - current hash.
 * @returns {string} recovery token, or an empty string when absent.
 */
export function getRecoverPasswordTokenFromHash(hashQueryParams, hash = '') {
  return hashQueryParams(hash).get('token') ?? '';
}

/**
 * Controller for the recover-password page.
 */
export default class RecoverPasswordController {
  /**
   * Create a recover-password controller.
   *
   * @param {Function} setStatus - status setter (`'idle' | 'submitting' | 'success' | 'error'`).
   * @param {Function} setErrorMessage - error message setter.
   * @param {AuthClient} [client] - HTTP client override.
   */
  constructor(setStatus, setErrorMessage, client = new AuthClient()) {
    this.setStatus = setStatus;
    this.setErrorMessage = setErrorMessage;
    this.client = client;
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

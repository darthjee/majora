import AuthClient from '../../../client/AuthClient.js';
import AuthEvents from '../../../utils/AuthEvents.js';
import AuthStorage from '../../../utils/AuthStorage.js';

/**
 * Manages authentication state and modal visibility for the Header element.
 */
export default class HeaderController {
  /**
   * Creates a new HeaderController instance.
   *
   * @param {Function} setLoggedIn - state setter for the logged-in flag.
   * @param {Function} setShowModal - state setter for the login modal visibility.
   * @param {Function} [setTestEmailStatus] - state setter for the test email status.
   * @param {AuthClient} [client] - HTTP client used for auth requests.
   */
  constructor(setLoggedIn, setShowModal, setTestEmailStatus = () => {}, client = new AuthClient()) {
    this.setLoggedIn = setLoggedIn;
    this.setShowModal = setShowModal;
    this.setTestEmailStatus = setTestEmailStatus;
    this.client = client;
  }

  /**
   * Checks the current authentication status using the stored token,
   * updates local state, and emits the result.
   *
   * @returns {Promise<void>} resolves when the status check finishes.
   */
  async checkStatus() {
    try {
      const response = await this.client.status(AuthStorage.getToken());

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      this.setLoggedIn(Boolean(data.logged_in));
      AuthEvents.emit(Boolean(data.logged_in));
    } catch {
      // Ignore status check failures; default unauthenticated state remains.
    }
  }

  /**
   * Opens the login modal.
   *
   * @returns {void}
   */
  handleLoginClick() {
    this.setShowModal(true);
  }

  /**
   * Logs the current user out, clearing the stored token and emitting
   * the resulting auth state.
   *
   * @returns {Promise<void>} resolves when the logout request finishes.
   */
  async handleLogoffClick() {
    const token = AuthStorage.getToken();

    try {
      await this.client.logout(token);
    } catch {
      // Ignore logout request failures; local auth state is cleared regardless.
    } finally {
      AuthStorage.clearToken();
      this.setLoggedIn(false);
      AuthEvents.emit(false);
    }
  }

  /**
   * Closes the login modal.
   *
   * @returns {void}
   */
  handleModalClose() {
    this.setShowModal(false);
  }

  /**
   * Handles a successful login by marking the user logged in and closing the modal.
   *
   * @returns {void}
   */
  handleLoginSuccess() {
    this.setLoggedIn(true);
    this.setShowModal(false);
  }

  /**
   * Sends a test email for the currently authenticated user, updating
   * the test email status state with the outcome.
   *
   * @returns {Promise<void>} resolves when the test email request finishes.
   */
  async handleSendTestEmailClick() {
    try {
      const response = await this.client.sendTestEmail(AuthStorage.getToken());

      this.setTestEmailStatus(response.ok ? 'sent' : 'error');
    } catch {
      this.setTestEmailStatus('error');
    }
  }
}

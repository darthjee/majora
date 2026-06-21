import LoginModal from '../LoginModal.jsx';

/**
 * Rendering helper for the Header element.
 */
export default class HeaderHelper {
  /**
   * Render the application header with navigation and auth controls.
   *
   * @param {{loggedIn: boolean, showModal: boolean, testEmailStatus: (string|null)}} state - header auth state.
   * @param {{onLoginClick: Function, onLogoffClick: Function, onModalClose: Function, onLoginSuccess: Function, onSendTestEmailClick: Function}} handlers - header event handlers.
   * @returns {React.ReactElement} Header element.
   */
  static render(state, handlers) {
    return (
      <header>
        <h1>
          <a href="#/">Majora</a>
        </h1>
        <p>RPG Campaign Management System</p>
        <nav>
          <ul>
            <li>
              <a href="#/games">Games</a>
            </li>
          </ul>
          {HeaderHelper.#renderAuthControl(state, handlers)}
        </nav>
        <LoginModal
          show={state.showModal}
          onClose={handlers.onModalClose}
          onSuccess={handlers.onLoginSuccess}
        />
      </header>
    );
  }

  /**
   * Renders the Login/Logoff control based on the current auth state.
   *
   * @param {{loggedIn: boolean, testEmailStatus: (string|null)}} state - header auth state.
   * @param {{onLoginClick: Function, onLogoffClick: Function, onSendTestEmailClick: Function}} handlers - header event handlers.
   * @returns {React.ReactElement} login control, or logoff/send-test-email controls.
   */
  static #renderAuthControl(state, handlers) {
    if (state.loggedIn) {
      return (
        <>
          <button
            type="button"
            className="btn btn-link"
            data-testid="auth-control"
            onClick={handlers.onLogoffClick}
          >
            Logoff
          </button>
          <button
            type="button"
            className="btn btn-link"
            data-testid="send-test-email"
            onClick={handlers.onSendTestEmailClick}
          >
            Send test email
          </button>
          {HeaderHelper.#renderTestEmailStatus(state)}
        </>
      );
    }

    return (
      <button
        type="button"
        className="btn btn-link"
        data-testid="auth-control"
        onClick={handlers.onLoginClick}
      >
        Login
      </button>
    );
  }

  /**
   * Renders feedback for the last test email send attempt, if any.
   *
   * @param {{testEmailStatus: (string|null)}} state - header auth state.
   * @returns {React.ReactElement|null} feedback message, or null when there is none.
   */
  static #renderTestEmailStatus(state) {
    if (state.testEmailStatus === 'sent') {
      return <span data-testid="test-email-status">Test email sent</span>;
    }

    if (state.testEmailStatus === 'error') {
      return <span data-testid="test-email-status">Failed to send test email</span>;
    }

    return null;
  }
}

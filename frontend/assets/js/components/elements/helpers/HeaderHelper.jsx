import LoginModal from '../LoginModal.jsx';

/**
 * Rendering helper for the Header element.
 */
export default class HeaderHelper {
  /**
   * Render the application header with navigation and auth controls.
   *
   * @param {{loggedIn: boolean, showModal: boolean}} state - header auth state.
   * @param {{onLoginClick: Function, onLogoffClick: Function, onModalClose: Function, onLoginSuccess: Function}} handlers - header event handlers.
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
   * @param {{loggedIn: boolean}} state - header auth state.
   * @param {{onLoginClick: Function, onLogoffClick: Function}} handlers - header event handlers.
   * @returns {React.ReactElement} login or logoff control.
   */
  static #renderAuthControl(state, handlers) {
    if (state.loggedIn) {
      return (
        <button
          type="button"
          className="btn btn-link"
          data-testid="auth-control"
          onClick={handlers.onLogoffClick}
        >
          Logoff
        </button>
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
}

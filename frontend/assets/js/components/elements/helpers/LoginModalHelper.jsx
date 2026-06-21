import Modal from 'react-bootstrap/cjs/Modal.js';

/**
 * Renders the login modal shell and form elements.
 */
export default class LoginModalHelper {
  /**
   * Renders the login modal.
   *
   * @param {boolean} show - whether the modal is visible.
   * @param {{username: string, password: string, incorrect: boolean, error: boolean}} state - modal state.
   * @param {{onClose: Function, onCancel: Function, onSubmit: Function, onUsernameChange: Function, onPasswordChange: Function}} handlers - modal event handlers.
   * @returns {React.ReactElement} rendered login modal.
   */
  static render(show, state, handlers) {
    return (
      <Modal show={show} onHide={handlers.onClose}>
        <form onSubmit={handlers.onSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>Login</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {LoginModalHelper.#renderError(state)}
            <div className="mb-3">
              <label htmlFor="username" className="form-label">Username</label>
              <input
                id="username"
                type="text"
                className="form-control"
                value={state.username}
                onChange={handlers.onUsernameChange}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                className="form-control"
                value={state.password}
                onChange={handlers.onPasswordChange}
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button className="btn btn-secondary" type="button" onClick={handlers.onCancel}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit">
              Login
            </button>
          </Modal.Footer>
        </form>
      </Modal>
    );
  }

  /**
   * Renders the error/incorrect-credentials alert for the modal body.
   *
   * @param {{incorrect: boolean, error: boolean}} state - modal state.
   * @returns {React.ReactElement|null} rendered alert, or null when there is nothing to show.
   */
  static #renderError(state) {
    if (state.incorrect) {
      return <div className="alert alert-danger">User name or password incorrect.</div>;
    }

    if (state.error) {
      return <div className="alert alert-danger">An unexpected error occurred, please try again later.</div>;
    }

    return null;
  }
}

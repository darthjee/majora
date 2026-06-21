/**
 * Rendering helper for the recover-password page.
 */
export default class RecoverPasswordHelper {
  /**
   * Render the recover-password page.
   *
   * @param {{password: string, confirmPassword: string, status: string, errorMessage: string}} state - page state.
   * @param {{onSubmit: Function, onPasswordChange: Function, onConfirmPasswordChange: Function}} handlers - event handlers.
   * @returns {React.ReactElement} rendered recover-password page.
   */
  static render(state, handlers) {
    return (
      <div className="container mt-4">
        <h1>Reset password</h1>
        {state.status === 'success'
          ? RecoverPasswordHelper.#renderSuccess()
          : RecoverPasswordHelper.#renderForm(state, handlers)}
      </div>
    );
  }

  static #renderForm(state, handlers) {
    return (
      <form onSubmit={handlers.onSubmit}>
        {RecoverPasswordHelper.#renderError(state)}
        <div className="mb-3">
          <label htmlFor="new-password" className="form-label">New password</label>
          <input
            id="new-password"
            type="password"
            className="form-control"
            value={state.password}
            onChange={handlers.onPasswordChange}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="confirm-password" className="form-label">Confirm new password</label>
          <input
            id="confirm-password"
            type="password"
            className="form-control"
            value={state.confirmPassword}
            onChange={handlers.onConfirmPasswordChange}
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={state.status === 'submitting'}>
          Reset password
        </button>
      </form>
    );
  }

  static #renderError(state) {
    if (state.status !== 'error') {
      return null;
    }

    return <div className="alert alert-danger">{state.errorMessage}</div>;
  }

  static #renderSuccess() {
    return (
      <div>
        <div className="alert alert-success">Your password has been reset.</div>
        <a className="btn btn-primary" href="#/">Back to home</a>
      </div>
    );
  }
}

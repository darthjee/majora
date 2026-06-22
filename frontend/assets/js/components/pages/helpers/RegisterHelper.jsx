import Translator from '../../../i18n/Translator.js';

/**
 * Rendering helper for the register page.
 */
export default class RegisterHelper {
  /**
   * Render the register page.
   *
   * @param {{name: string, email: string, password: string, passwordConfirmation: string,
   *   status: string, errorMessage: string}} state - page state.
   * @param {{onSubmit: Function, onNameChange: Function, onEmailChange: Function,
   *   onPasswordChange: Function, onPasswordConfirmationChange: Function}} handlers - event handlers.
   * @returns {React.ReactElement} rendered register page.
   */
  static render(state, handlers) {
    return (
      <div className="container mt-4">
        <h1>{Translator.t('register_page.title')}</h1>
        <form onSubmit={handlers.onSubmit}>
          {RegisterHelper.#renderError(state)}
          <div className="mb-3">
            <label htmlFor="register-name" className="form-label">
              {Translator.t('register_page.name_label')}
            </label>
            <input
              id="register-name"
              type="text"
              className="form-control"
              value={state.name}
              onChange={handlers.onNameChange}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="register-email" className="form-label">
              {Translator.t('register_page.email_label')}
            </label>
            <input
              id="register-email"
              type="email"
              className="form-control"
              value={state.email}
              onChange={handlers.onEmailChange}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="register-password" className="form-label">
              {Translator.t('register_page.password_label')}
            </label>
            <input
              id="register-password"
              type="password"
              className="form-control"
              value={state.password}
              onChange={handlers.onPasswordChange}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="register-password-confirmation" className="form-label">
              {Translator.t('register_page.password_confirmation_label')}
            </label>
            <input
              id="register-password-confirmation"
              type="password"
              className="form-control"
              value={state.passwordConfirmation}
              onChange={handlers.onPasswordConfirmationChange}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={state.status === 'submitting'}>
            {Translator.t('register_page.submit')}
          </button>
        </form>
      </div>
    );
  }

  static #renderError(state) {
    if (state.status !== 'error') {
      return null;
    }

    return <div className="alert alert-danger">{state.errorMessage}</div>;
  }
}

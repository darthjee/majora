import FormField from '../../../../elements/FormField.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the register page.
 */
export default class RegisterHelper {
  /**
   * Render the register page.
   *
   * @param {{name: string, email: string, password: string, passwordConfirmation: string,
   *   status: string}} state - page state.
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
          <FormField
            id="register-name"
            type="text"
            label={Translator.t('register_page.name_label')}
            value={state.name}
            onChange={handlers.onNameChange}
          />
          <FormField
            id="register-email"
            type="email"
            label={Translator.t('register_page.email_label')}
            value={state.email}
            onChange={handlers.onEmailChange}
          />
          <FormField
            id="register-password"
            type="password"
            label={Translator.t('register_page.password_label')}
            value={state.password}
            onChange={handlers.onPasswordChange}
          />
          <FormField
            id="register-password-confirmation"
            type="password"
            label={Translator.t('register_page.password_confirmation_label')}
            value={state.passwordConfirmation}
            onChange={handlers.onPasswordConfirmationChange}
          />
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

    return <div className="alert alert-danger">{Translator.t('register_page.error')}</div>;
  }
}

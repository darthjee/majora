import FormField from '../../../../common/FormField.jsx';
import Translator from '../../../../../i18n/Translator.js';

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
        <h1>{Translator.t('recover_password_page.title')}</h1>
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
        <FormField
          id="new-password"
          type="password"
          label={Translator.t('recover_password_page.new_password_label')}
          value={state.password}
          onChange={handlers.onPasswordChange}
        />
        <FormField
          id="confirm-password"
          type="password"
          label={Translator.t('recover_password_page.confirm_password_label')}
          value={state.confirmPassword}
          onChange={handlers.onConfirmPasswordChange}
        />
        <button className="btn btn-primary" type="submit" disabled={state.status === 'submitting'}>
          {Translator.t('recover_password_page.submit')}
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
        <div className="alert alert-success">{Translator.t('recover_password_page.success')}</div>
        <a className="btn btn-primary" href="#/">{Translator.t('recover_password_page.back_to_home')}</a>
      </div>
    );
  }
}

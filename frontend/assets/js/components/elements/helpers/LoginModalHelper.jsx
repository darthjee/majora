import Modal from 'react-bootstrap/cjs/Modal.js';
import FormField from '../FormField.jsx';
import Translator from '../../../i18n/Translator.js';

/**
 * Renders the login modal shell and form elements.
 */
export default class LoginModalHelper {
  /**
   * Renders the login modal.
   *
   * @param {boolean} show - whether the modal is visible.
   * @param {{username: string, password: string, incorrect: boolean, error: boolean,
   *   mode: string, email: string, recoverySent: boolean}} state - modal state.
   * @param {{onClose: Function, onCancel: Function, onSubmit: Function, onUsernameChange: Function,
   *   onPasswordChange: Function, onForgotPasswordClick: Function, onRegisterClick: Function,
   *   onBackToLoginClick: Function, onEmailChange: Function, onRecoverSubmit: Function}} handlers - modal event handlers.
   * @returns {React.ReactElement} rendered login modal.
   */
  static render(show, state, handlers) {
    return (
      <Modal show={show} onHide={handlers.onClose}>
        {state.mode === 'recover'
          ? LoginModalHelper.#renderRecover(state, handlers)
          : LoginModalHelper.#renderLogin(state, handlers)}
      </Modal>
    );
  }

  static #renderLogin(state, handlers) {
    return (
      <form onSubmit={handlers.onSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('login_modal.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {LoginModalHelper.#renderError(state)}
          <FormField
            id="username"
            type="text"
            label={Translator.t('login_modal.username_label')}
            value={state.username}
            onChange={handlers.onUsernameChange}
          />
          <FormField
            id="password"
            type="password"
            label={Translator.t('login_modal.password_label')}
            value={state.password}
            onChange={handlers.onPasswordChange}
          />
          <button
            className="btn btn-link p-0"
            type="button"
            onClick={handlers.onForgotPasswordClick}
          >
            {Translator.t('login_modal.forgot_password')}
          </button>
          <button
            className="btn btn-link p-0 d-block"
            type="button"
            onClick={handlers.onRegisterClick}
          >
            {Translator.t('login_modal.register_link')}
          </button>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" type="button" onClick={handlers.onCancel}>
            {Translator.t('login_modal.cancel')}
          </button>
          <button className="btn btn-primary" type="submit">
            {Translator.t('login_modal.submit')}
          </button>
        </Modal.Footer>
      </form>
    );
  }

  static #renderRecover(state, handlers) {
    if (state.recoverySent) {
      return LoginModalHelper.#renderRecoverySentConfirmation(handlers);
    }

    return (
      <form onSubmit={handlers.onRecoverSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('login_modal.recover_title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FormField
            id="recover-email"
            type="email"
            label={Translator.t('login_modal.email_label')}
            value={state.email}
            onChange={handlers.onEmailChange}
          />
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" type="button" onClick={handlers.onBackToLoginClick}>
            {Translator.t('login_modal.back_to_login')}
          </button>
          <button className="btn btn-primary" type="submit">
            {Translator.t('login_modal.recover_submit')}
          </button>
        </Modal.Footer>
      </form>
    );
  }

  static #renderRecoverySentConfirmation(handlers) {
    return (
      <>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('login_modal.recover_title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-info">
            {Translator.t('login_modal.recovery_sent')}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" type="button" onClick={handlers.onBackToLoginClick}>
            {Translator.t('login_modal.back_to_login')}
          </button>
        </Modal.Footer>
      </>
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
      return <div className="alert alert-danger">{Translator.t('login_modal.incorrect')}</div>;
    }

    if (state.error) {
      return <div className="alert alert-danger">{Translator.t('login_modal.error')}</div>;
    }

    return null;
  }
}

import Modal from 'react-bootstrap/cjs/Modal.js';
import FormField from '../../../common/forms/FormField.jsx';
import Translator from '../../../../i18n/Translator.js';

const PENDING_AUTHORIZE_STATUSES = new Set(['waiting', 'retrying']);

/**
 * Renders the login modal shell and form elements.
 */
export default class LoginModalHelper {
  /**
   * Renders the login modal.
   *
   * @param {boolean} show - whether the modal is visible.
   * @param {{username: string, password: string, incorrect: boolean, error: boolean,
   *   mode: string, email: string, recoverySent: boolean, authorizeStatus: (string|null)}} state -
   *   modal state.
   * @param {{onClose: Function, onCancel: Function, onSubmit: Function, onUsernameChange: Function,
   *   onPasswordChange: Function, onForgotPasswordClick: Function, onRegisterClick: Function,
   *   onBackToLoginClick: Function, onEmailChange: Function, onRecoverSubmit: Function,
   *   onModeChange: Function, onAuthorizeSubmit: Function, onAuthorizeReset: Function}} handlers -
   *   modal event handlers.
   * @returns {React.ReactElement} rendered login modal.
   */
  static render(show, state, handlers) {
    return (
      <Modal show={show} onHide={handlers.onClose}>
        {LoginModalHelper.#renderBody(state, handlers)}
      </Modal>
    );
  }

  static #renderBody(state, handlers) {
    if (state.mode === 'recover') {
      return LoginModalHelper.#renderRecover(state, handlers);
    }

    if (state.mode === 'authorize') {
      return LoginModalHelper.#renderAuthorize(state, handlers);
    }

    return LoginModalHelper.#renderLogin(state, handlers);
  }

  static #renderLogin(state, handlers) {
    return (
      <form onSubmit={handlers.onSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('login_modal.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {LoginModalHelper.#renderError(state)}
          {LoginModalHelper.#renderModeSelector(state, handlers)}
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

  static #renderAuthorize(state, handlers) {
    if (state.authorizeStatus) {
      return LoginModalHelper.#renderAuthorizeStatus(state, handlers);
    }

    return (
      <form onSubmit={handlers.onAuthorizeSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('login_modal.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {LoginModalHelper.#renderModeSelector(state, handlers)}
          <FormField
            id="authorize-username"
            type="text"
            label={Translator.t('login_modal.authorize_username_label')}
            value={state.username}
            onChange={handlers.onUsernameChange}
          />
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" type="button" onClick={handlers.onCancel}>
            {Translator.t('login_modal.cancel')}
          </button>
          <button className="btn btn-primary" type="submit">
            {Translator.t('login_modal.authorize_submit')}
          </button>
        </Modal.Footer>
      </form>
    );
  }

  static #renderAuthorizeStatus(state, handlers) {
    const isPending = PENDING_AUTHORIZE_STATUSES.has(state.authorizeStatus);

    return (
      <>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('login_modal.authorize_waiting_title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {LoginModalHelper.#renderAuthorizeStatusBody(state, isPending)}
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" type="button" onClick={handlers.onCancel}>
            {Translator.t('login_modal.cancel')}
          </button>
          {!isPending && (
            <button className="btn btn-primary" type="button" onClick={handlers.onAuthorizeReset}>
              {Translator.t('login_modal.authorize_submit')}
            </button>
          )}
        </Modal.Footer>
      </>
    );
  }

  static #renderAuthorizeStatusBody(state, isPending) {
    if (isPending) {
      return (
        <>
          <div className="spinner-border" role="status" aria-hidden="true"></div>
          <p>
            {state.authorizeStatus === 'retrying'
              ? Translator.t('login_modal.authorize_retry')
              : Translator.t('login_modal.authorize_waiting_body')}
          </p>
        </>
      );
    }

    return <p>{Translator.t(`login_modal.authorize_${state.authorizeStatus}`)}</p>;
  }

  static #renderModeSelector(state, handlers) {
    return (
      <div className="mb-3" role="radiogroup" aria-label={Translator.t('login_modal.mode_password_label')}>
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="login-mode"
            id="login-mode-password"
            value="login"
            checked={state.mode === 'login'}
            onChange={() => handlers.onModeChange('login')}
          />
          <label className="form-check-label" htmlFor="login-mode-password">
            {Translator.t('login_modal.mode_password_label')}
          </label>
        </div>
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="login-mode"
            id="login-mode-authorize"
            value="authorize"
            checked={state.mode === 'authorize'}
            onChange={() => handlers.onModeChange('authorize')}
          />
          <label className="form-check-label" htmlFor="login-mode-authorize">
            {Translator.t('login_modal.mode_authorize_label')}
          </label>
        </div>
      </div>
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

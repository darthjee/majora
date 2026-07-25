import Modal from 'react-bootstrap/cjs/Modal.js';
import FormField from '../../../../../common/forms/FormField.jsx';
import Translator from '../../../../../../i18n/Translator.js';
import AuthorizationRequestInfo from '../AuthorizationRequestInfo.jsx';

/**
 * Renders the authorize-authorization-request confirmation modal shell.
 */
export default class AuthorizeAuthorizationRequestModalHelper {
  /**
   * Renders the authorize confirmation modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {{ip: string, browser: string}|null} request - Authorization request being authorized.
   * @param {{password: string, error: boolean}} state - Password field value and invalid-password error flag.
   * @param {{onPasswordChange: Function, onConfirm: Function, onCancel: Function}} handlers - Modal
   *   event handlers.
   * @returns {React.ReactElement} Rendered authorize confirmation modal.
   */
  static render(show, request, state, handlers) {
    return (
      <Modal show={show} onHide={handlers.onCancel}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('authorization_requests_page.authorize_modal_title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{Translator.t('authorization_requests_page.authorize_modal_body')}</p>
          <AuthorizationRequestInfo request={request} />
          {AuthorizeAuthorizationRequestModalHelper.#renderError(state)}
          <FormField
            id="authorize-request-password"
            type="password"
            label={Translator.t('authorization_requests_page.password_label')}
            value={state.password}
            onChange={handlers.onPasswordChange}
          />
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" type="button" onClick={handlers.onCancel}>
            {Translator.t('authorization_requests_page.cancel')}
          </button>
          <button className="btn btn-primary" type="button" onClick={handlers.onConfirm}>
            {Translator.t('authorization_requests_page.authorize')}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }

  static #renderError(state) {
    if (!state.error) {
      return null;
    }

    return <div className="alert alert-danger">{Translator.t('authorization_requests_page.error')}</div>;
  }
}

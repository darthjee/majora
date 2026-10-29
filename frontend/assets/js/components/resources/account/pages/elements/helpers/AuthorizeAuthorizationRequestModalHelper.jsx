import Modal from 'react-bootstrap/cjs/Modal.js';
import FormField from '../../../../../common/forms/FormField.jsx';
import Translator from '../../../../../../i18n/Translator.js';
import AuthorizationRequestInfo from '../AuthorizationRequestInfo.jsx';
import AuthorizationRequestScopes from '../AuthorizationRequestScopes.jsx';

/**
 * Renders the authorize-authorization-request confirmation modal shell.
 */
export default class AuthorizeAuthorizationRequestModalHelper {
  /**
   * Renders the authorize confirmation modal.
   *
   * @description A request carrying a non-empty `scopes` list is a token request: it gets the
   *   token title and body, and lists the requested permissions. Other requests are plain
   *   login requests.
   * @param {boolean} show - Whether the modal is visible.
   * @param {{ip: string, browser: string, scopes: (Array<string>|undefined)}|null} request -
   *   Authorization request being authorized.
   * @param {{password: string, error: boolean}} state - Password field value and invalid-password error flag.
   * @param {{onPasswordChange: Function, onConfirm: Function, onCancel: Function}} handlers - Modal
   *   event handlers.
   * @returns {React.ReactElement} Rendered authorize confirmation modal.
   */
  static render(show, request, state, handlers) {
    const kind = AuthorizeAuthorizationRequestModalHelper.#kind(request);

    return (
      <Modal show={show} onHide={handlers.onCancel}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t(`authorization_requests_page.authorize${kind}_modal_title`)}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{Translator.t(`authorization_requests_page.authorize${kind}_modal_body`)}</p>
          <AuthorizationRequestScopes scopes={request?.scopes} />
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

  /**
   * Pick the translation key infix of the request kind.
   *
   * @param {{scopes: (Array<string>|undefined)}|null} request - Authorization request.
   * @returns {string} `'_token'` for a token request, `''` for a plain login request.
   */
  static #kind(request) {
    return request?.scopes?.length > 0 ? '_token' : '';
  }

  static #renderError(state) {
    if (!state.error) {
      return null;
    }

    return <div className="alert alert-danger">{Translator.t('authorization_requests_page.error')}</div>;
  }
}

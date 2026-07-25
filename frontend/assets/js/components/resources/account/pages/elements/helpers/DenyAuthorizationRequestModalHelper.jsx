import Modal from 'react-bootstrap/cjs/Modal.js';
import Translator from '../../../../../../i18n/Translator.js';
import AuthorizationRequestInfo from '../AuthorizationRequestInfo.jsx';

/**
 * Renders the deny-authorization-request confirmation modal shell.
 */
export default class DenyAuthorizationRequestModalHelper {
  /**
   * Renders the deny confirmation modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {{ip: string, browser: string}|null} request - Authorization request being denied.
   * @param {{onConfirm: Function, onCancel: Function}} handlers - Modal event handlers.
   * @returns {React.ReactElement} Rendered deny confirmation modal.
   */
  static render(show, request, handlers) {
    return (
      <Modal show={show} onHide={handlers.onCancel}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('authorization_requests_page.dismiss_modal_title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{Translator.t('authorization_requests_page.dismiss_modal_body')}</p>
          <AuthorizationRequestInfo request={request} />
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" type="button" onClick={handlers.onCancel}>
            {Translator.t('authorization_requests_page.cancel')}
          </button>
          <button className="btn btn-danger" type="button" onClick={handlers.onConfirm}>
            {Translator.t('authorization_requests_page.confirm')}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }
}

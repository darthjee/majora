import Modal from 'react-bootstrap/cjs/Modal.js';
import Translator from '../../../../i18n/Translator.js';

/**
 * Renders the shared revoke-API-token confirmation modal shell (issue #1605).
 */
export default class ApiTokenRevokeConfirmModalHelper {
  /**
   * Renders the revoke confirmation modal.
   *
   * @param {{show: boolean, tokenName: (string|undefined), ownerName: (string|undefined),
   *   submitting: boolean}} state - Modal state.
   * @param {{onConfirm: Function, onCancel: Function}} handlers - Modal event handlers.
   * @returns {React.ReactElement} Rendered revoke confirmation modal.
   */
  static render(state, handlers) {
    return (
      <Modal show={state.show} onHide={handlers.onCancel}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('api_tokens_page.revoke_title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{ApiTokenRevokeConfirmModalHelper.body(state)}</p>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={handlers.onCancel}
            disabled={state.submitting}
          >
            {Translator.t('api_tokens_page.cancel')}
          </button>
          <button
            className="btn btn-danger"
            type="button"
            onClick={handlers.onConfirm}
            disabled={state.submitting}
            data-testid="api-token-revoke-confirm"
          >
            {Translator.t('api_tokens_page.revoke_confirm')}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }

  /**
   * Build the modal body text, naming the token and, in the staff variant, its owner.
   *
   * @param {{tokenName: (string|undefined), ownerName: (string|undefined)}} state - Modal state.
   * @returns {string} The interpolated body text.
   */
  static body({ tokenName = '', ownerName }) {
    if (ownerName) {
      return Translator.t('api_tokens_page.revoke_body_staff')
        .replace('{{name}}', tokenName)
        .replace('{{owner}}', ownerName);
    }

    return Translator.t('api_tokens_page.revoke_body').replace('{{name}}', tokenName);
  }
}

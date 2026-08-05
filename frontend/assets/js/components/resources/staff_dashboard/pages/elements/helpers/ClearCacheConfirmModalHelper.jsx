import Modal from 'react-bootstrap/cjs/Modal.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Renders the clear-cache confirmation modal shell.
 */
export default class ClearCacheConfirmModalHelper {
  /**
   * Renders the clear-cache confirmation modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {{onConfirm: Function, onCancel: Function}} handlers - Modal event handlers.
   * @returns {React.ReactElement} Rendered clear-cache confirmation modal.
   */
  static render(show, handlers) {
    return (
      <Modal show={show} onHide={handlers.onCancel}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('clear_cache_confirm_modal.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{Translator.t('clear_cache_confirm_modal.body')}</Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" type="button" onClick={handlers.onCancel}>
            {Translator.t('clear_cache_confirm_modal.cancel')}
          </button>
          <button className="btn btn-danger" type="button" onClick={handlers.onConfirm}>
            {Translator.t('clear_cache_confirm_modal.confirm')}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }
}

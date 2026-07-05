import Modal from 'react-bootstrap/cjs/Modal.js';
import Translator from '../../../i18n/Translator.js';

/**
 * Renders the slain/revive confirmation modal shell.
 */
export default class SlainConfirmModalHelper {
  /**
   * Renders the slain confirmation modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {boolean} slain - The character's *current* slain state, used to pick the
   *   title/body copy and the confirm button's label/variant.
   * @param {{onConfirm: Function, onCancel: Function}} handlers - Modal event handlers.
   * @returns {React.ReactElement} Rendered slain confirmation modal.
   */
  static render(show, slain, handlers) {
    const titleKey = slain ? 'slain_confirm_modal.revive_title' : 'slain_confirm_modal.slain_title';
    const bodyKey = slain ? 'slain_confirm_modal.revive_body' : 'slain_confirm_modal.slain_body';
    const confirmVariant = slain ? 'btn-success' : 'btn-danger';

    return (
      <Modal show={show} onHide={handlers.onCancel}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t(titleKey)}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{Translator.t(bodyKey)}</Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" type="button" onClick={handlers.onCancel}>
            {Translator.t('slain_confirm_modal.cancel')}
          </button>
          <button className={`btn ${confirmVariant}`} type="button" onClick={handlers.onConfirm}>
            {Translator.t('slain_confirm_modal.confirm')}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }
}

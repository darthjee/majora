import Modal from 'react-bootstrap/cjs/Modal.js';
import Translator from '../../../i18n/Translator.js';

/**
 * Renders the slain/revive confirmation modal shell.
 */
export default class SlainConfirmModalHelper {
  /**
   * Picks the title/body i18n keys for the given state and field.
   *
   * @param {boolean} slain - The character's *current* state for the target field.
   * @param {boolean} isPublic - Whether the modal is toggling the public field.
   * @returns {{titleKey: string, bodyKey: string}} The title and body i18n keys.
   */
  static #pickKeys(slain, isPublic) {
    const prefix = isPublic ? 'public_' : '';
    const suffix = slain ? 'revive' : 'slain';

    return {
      titleKey: `slain_confirm_modal.${prefix}${suffix}_title`,
      bodyKey: `slain_confirm_modal.${prefix}${suffix}_body`,
    };
  }

  /**
   * Renders the slain confirmation modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {boolean} slain - The character's *current* state for the target field, used to
   *   pick the title/body copy and the confirm button's label/variant.
   * @param {boolean} isPublic - Whether the modal is toggling the public_slain field rather
   *   than the real slain field.
   * @param {{onConfirm: Function, onCancel: Function}} handlers - Modal event handlers.
   * @returns {React.ReactElement} Rendered slain confirmation modal.
   */
  static render(show, slain, isPublic, handlers) {
    const { titleKey, bodyKey } = SlainConfirmModalHelper.#pickKeys(slain, isPublic);
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

import Modal from 'react-bootstrap/cjs/Modal.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Renders the delete-photo confirmation modal shell.
 */
export default class DeletePhotoConfirmModalHelper {
  /**
   * Renders the delete-photo confirmation modal.
   *
   * @param {boolean} show - Whether the modal is visible.
   * @param {object|null} photo - Photo pending deletion, or null when none is selected.
   * @param {{onConfirm: Function, onCancel: Function}} handlers - Modal event handlers.
   * @returns {React.ReactElement} Rendered delete-photo confirmation modal.
   */
  static render(show, photo, handlers) {
    return (
      <Modal show={show} onHide={handlers.onCancel}>
        <Modal.Header closeButton>
          <Modal.Title>{Translator.t('delete_photo_confirm_modal.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{Translator.t('delete_photo_confirm_modal.body')}</Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" type="button" onClick={handlers.onCancel}>
            {Translator.t('delete_photo_confirm_modal.cancel')}
          </button>
          <button className="btn btn-danger" type="button" onClick={handlers.onConfirm}>
            {Translator.t('delete_photo_confirm_modal.confirm')}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }
}

import Modal from 'react-bootstrap/cjs/Modal.js';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Confirmation modal shell of the staff photos page actions (issue #1474).
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {string} props.title - Translated modal title.
 * @param {string} props.body - Translated modal body.
 * @param {string} [props.variant] - Bootstrap variant of the confirm button.
 * @param {Function} props.onConfirm - Called when the action is confirmed.
 * @param {Function} props.onCancel - Called when the modal is dismissed.
 * @returns {React.ReactElement} Confirmation modal.
 */
export default function StaffPhotoConfirmModal({
  show, title, body, variant = 'primary', onConfirm, onCancel,
}) {
  return (
    <Modal show={show} onHide={onCancel}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary" type="button" onClick={onCancel}>
          {Translator.t('staff_photos_page.cancel')}
        </button>
        <button className={`btn btn-${variant}`} type="button" onClick={onConfirm}>
          {Translator.t('staff_photos_page.confirm')}
        </button>
      </Modal.Footer>
    </Modal>
  );
}

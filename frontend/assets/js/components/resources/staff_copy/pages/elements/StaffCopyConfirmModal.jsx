import Modal from 'react-bootstrap/cjs/Modal.js';
import Translator from '../../../../../i18n/Translator.js';

const PREFIX = 'staff_copies_page';

/**
 * Re-copy confirmation modal of the staff copy page (issue #1571).
 *
 * @description Shown before a run when some selected rows were already copied into the target
 *   game. Cancel aborts the whole run; accept runs every selected row.
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {Function} props.onConfirm - Called when the re-copy is accepted.
 * @param {Function} props.onCancel - Called when the modal is dismissed.
 * @returns {React.ReactElement} Confirmation modal.
 */
export default function StaffCopyConfirmModal({ show, onConfirm, onCancel }) {
  return (
    <Modal show={show} onHide={onCancel}>
      <Modal.Header closeButton>
        <Modal.Title>{Translator.t(`${PREFIX}.recopy_confirm_title`)}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{Translator.t(`${PREFIX}.recopy_confirm_body`)}</Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary" type="button" onClick={onCancel}>
          {Translator.t(`${PREFIX}.recopy_confirm_cancel`)}
        </button>
        <button className="btn btn-primary" type="button" onClick={onConfirm}>
          {Translator.t(`${PREFIX}.recopy_confirm_accept`)}
        </button>
      </Modal.Footer>
    </Modal>
  );
}

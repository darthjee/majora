import Translator from '../../../../../i18n/Translator.js';
import StaffPhotoConfirmModal from './StaffPhotoConfirmModal.jsx';

/**
 * Confirmation modal shown before running a bulk Resize / Delete (issue #1474).
 *
 * @param {object} props - Component props.
 * @param {{action: string, photos: object[]}|null} props.pending - Pending bulk job; the modal
 *   is hidden when `null`.
 * @param {number|null} props.maxDimension - Max dimension of the longest side.
 * @param {Function} props.onConfirm - Called when the bulk job is confirmed.
 * @param {Function} props.onCancel - Called when the modal is dismissed.
 * @returns {React.ReactElement} Bulk confirmation modal.
 */
export default function StaffPhotoBulkConfirmModal({
  pending, maxDimension, onConfirm, onCancel,
}) {
  const { action = 'resize', photos = [] } = pending ?? {};
  const prefix = `staff_photos_page.bulk_confirm_${action}`;

  return (
    <StaffPhotoConfirmModal
      show={pending !== null}
      title={Translator.t(`${prefix}_title`)}
      body={Translator.t(`${prefix}_body`).replace('{{count}}', photos.length).replace('{{max}}', maxDimension)}
      variant={action === 'delete' ? 'danger' : 'primary'}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

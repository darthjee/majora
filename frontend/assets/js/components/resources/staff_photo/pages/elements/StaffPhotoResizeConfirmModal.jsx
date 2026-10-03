import Translator from '../../../../../i18n/Translator.js';
import StaffPhotoConfirmModal from './StaffPhotoConfirmModal.jsx';

/**
 * Confirmation modal shown before resizing a single staff photo (issue #1474).
 *
 * @param {object} props - Component props.
 * @param {object|null} props.photo - Photo pending resize; the modal is hidden when `null`.
 * @param {number|null} props.maxDimension - Max dimension of the longest side.
 * @param {Function} props.onConfirm - Called when the resize is confirmed.
 * @param {Function} props.onCancel - Called when the modal is dismissed.
 * @returns {React.ReactElement} Resize confirmation modal.
 */
export default function StaffPhotoResizeConfirmModal({
  photo, maxDimension, onConfirm, onCancel,
}) {
  return (
    <StaffPhotoConfirmModal
      show={photo !== null}
      title={Translator.t('staff_photos_page.resize_confirm_title')}
      body={Translator.t('staff_photos_page.resize_confirm_body').replace('{{max}}', maxDimension)}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

import PhotoUploadModal from '../../../../common/modals/PhotoUploadModal.jsx';
import MoneyEditModal from '../../../../common/modals/MoneyEditModal.jsx';

/**
 * Modal wiring for the game common item edit page (issue #826): the photo upload modal for the
 * upload action button and the price-editing modal (`MoneyEditModal`, reusing the `'treasure'`
 * money context) paired with the collapsed price field, extracted out of
 * {@link module:GameCommonItemEdit} to keep its render method within size limits.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.showUploadModal - Whether the photo upload modal is visible.
 * @param {boolean} props.showPriceModal - Whether the price edit modal is visible.
 * @param {string} props.uploadPath - Photo upload endpoint path.
 * @param {string} props.price - Current price value, as a string.
 * @param {Function} props.onUploadClose - Handler invoked when the upload modal is dismissed.
 * @param {Function} props.onUploadSuccess - Handler invoked when the photo upload succeeds.
 * @param {Function} props.onPriceClose - Handler invoked when the price modal is dismissed.
 * @param {Function} props.onPriceConfirm - Handler invoked with the new total when the price
 *   modal is confirmed.
 * @returns {React.ReactElement} Rendered modal wiring fragment.
 */
export default function GameCommonItemEditModals({
  showUploadModal, showPriceModal, uploadPath, price,
  onUploadClose, onUploadSuccess, onPriceClose, onPriceConfirm,
}) {
  return (
    <>
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={uploadPath}
        onClose={onUploadClose}
        onSuccess={onUploadSuccess}
      />
      <MoneyEditModal
        show={showPriceModal}
        money={price}
        context="treasure"
        onClose={onPriceClose}
        onConfirm={onPriceConfirm}
      />
    </>
  );
}

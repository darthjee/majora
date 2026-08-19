import PhotoUploadModal from '../../../../common/modals/PhotoUploadModal.jsx';
import MoneyEditModal from '../../../../common/modals/MoneyEditModal.jsx';

/**
 * Modal wiring for the game common item creation page (issue #826): the deferred photo upload
 * modal (the photo is only actually uploaded after the item itself is created) and the
 * price-editing modal (`MoneyEditModal`, reusing the `'treasure'` money context), extracted out of
 * {@link module:GameCommonItemNew} to keep its render method within size limits.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.showUploadModal - Whether the photo upload modal is visible.
 * @param {boolean} props.showPriceModal - Whether the price edit modal is visible.
 * @param {string} props.price - Current price value, as a string.
 * @param {Function} props.onFileConfirmed - Handler invoked with the picked file once confirmed.
 * @param {Function} props.onUploadClose - Handler invoked when the upload modal is dismissed.
 * @param {Function} props.onPriceClose - Handler invoked when the price modal is dismissed.
 * @param {Function} props.onPriceConfirm - Handler invoked with the new total when the price
 *   modal is confirmed.
 * @returns {React.ReactElement} Rendered modal wiring fragment.
 */
export default function GameCommonItemNewModals({
  showUploadModal, showPriceModal, price,
  onFileConfirmed, onUploadClose, onPriceClose, onPriceConfirm,
}) {
  return (
    <>
      <PhotoUploadModal
        show={showUploadModal}
        deferred
        onFileConfirmed={onFileConfirmed}
        onClose={onUploadClose}
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

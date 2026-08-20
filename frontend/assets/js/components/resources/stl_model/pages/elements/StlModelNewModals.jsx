import PhotoUploadModal from '../../../../common/modals/PhotoUploadModal.jsx';

/**
 * Modal wiring for the "New STL model" page (issue #1069): the deferred photo upload modal (the
 * photo is only actually uploaded after the model itself is created), extracted out of
 * {@link module:StlModelNew} to keep its render method within size limits.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.showUploadModal - Whether the photo upload modal is visible.
 * @param {Function} props.setPhotoFile - Setter invoked with the picked file once confirmed.
 * @param {Function} props.onClose - Handler invoked when the upload modal is dismissed.
 * @returns {React.ReactElement} Rendered modal wiring fragment.
 */
export default function StlModelNewModals({ showUploadModal, setPhotoFile, onClose }) {
  return (
    <PhotoUploadModal
      show={showUploadModal}
      deferred
      onFileConfirmed={(file) => {
        setPhotoFile(file);
        onClose();
      }}
      onClose={onClose}
    />
  );
}

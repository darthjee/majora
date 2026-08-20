import PhotoUploadModal from '../../../../common/modals/PhotoUploadModal.jsx';
import PhotoViewModal from '../../../../common/modals/PhotoViewModal.jsx';
import GiveDocumentModal from './GiveDocumentModal.jsx';

/**
 * Modal wiring for the game document detail page (issues #727, #726, #878, #873, #1005): the
 * photo upload modal, the PDF file-upload modal (with its optional chained photo field), the
 * photo shortlist's lightbox (`PhotoViewModal`), and the give-document modal, extracted out of
 * {@link module:GameDocument} to keep its render method within size limits.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.showUploadModal - Whether the photo upload modal is visible.
 * @param {boolean} props.showFileUploadModal - Whether the PDF file-upload modal is visible.
 * @param {boolean} props.showGiveDocumentModal - Whether the give-document modal is visible.
 * @param {object} props.document - The loaded `GameDocument` (or `null` while loading).
 * @param {string} props.gameSlug - Game slug.
 * @param {boolean} props.canGiveHidden - Whether the current user may give this document even
 *   when hidden.
 * @param {object} props.selectedPhoto - Currently selected photo for the lightbox, or `null`.
 * @param {string} props.uploadPath - Photo upload endpoint path.
 * @param {string} props.fileUploadPath - PDF file upload endpoint path.
 * @param {Function} props.buildFilePhotoUploadPath - Builds the chained photo upload's init path
 *   from the newly created file's id.
 * @param {Function} props.onUploadSuccess - Handler invoked when the photo upload succeeds.
 * @param {Function} props.onFileUploadSuccess - Handler invoked when the file upload succeeds.
 * @param {Function} props.onUploadClose - Handler invoked when the upload modal is dismissed.
 * @param {Function} props.onFileUploadClose - Handler invoked when the file upload modal is
 *   dismissed.
 * @param {Function} props.onSelectPhoto - Handler invoked with the photo (or `null`) to update
 *   the lightbox selection.
 * @param {Function} props.onGiveDocumentClose - Handler invoked when the give-document modal is
 *   dismissed.
 * @returns {React.ReactElement} Rendered modal wiring fragment.
 */
export default function GameDocumentModals({
  showUploadModal, showFileUploadModal, showGiveDocumentModal,
  document, gameSlug, canGiveHidden, selectedPhoto,
  uploadPath, fileUploadPath, buildFilePhotoUploadPath,
  onUploadSuccess, onFileUploadSuccess, onUploadClose, onFileUploadClose,
  onSelectPhoto, onGiveDocumentClose,
}) {
  return (
    <>
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={uploadPath}
        onClose={onUploadClose}
        onSuccess={onUploadSuccess}
      />
      <PhotoUploadModal
        show={showFileUploadModal}
        uploadPath={fileUploadPath}
        fileUploadOptions={{
          translationPrefix: 'file_upload_modal',
          accept: '.pdf',
          showNameField: true,
          showPhotoField: true,
          photoUploadPathBuilder: buildFilePhotoUploadPath,
        }}
        onClose={onFileUploadClose}
        onSuccess={onFileUploadSuccess}
      />
      <PhotoViewModal
        show={selectedPhoto !== null}
        photo={selectedPhoto}
        alt={document?.name}
        onClose={() => onSelectPhoto(null)}
        setProfilePhoto={{ canSetProfilePhoto: false }}
      />
      <GiveDocumentModal
        show={showGiveDocumentModal}
        document={document ?? {}}
        gameSlug={gameSlug}
        canGiveHidden={canGiveHidden}
        onClose={onGiveDocumentClose}
      />
    </>
  );
}

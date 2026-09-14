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
 * @param {object} props.document - The loaded `GameDocument` (or `null` while loading).
 * @param {string} props.gameSlug - Game slug.
 * @param {object} props.selectedPhoto - Currently selected photo for the lightbox, or `null`.
 * @param {Function} props.onSelectPhoto - Handler invoked with the photo (or `null`) to update
 *   the lightbox selection.
 * @param {object} props.uploadModal - Photo upload modal wiring.
 * @param {boolean} props.uploadModal.show - Whether the photo upload modal is visible.
 * @param {string} props.uploadModal.path - Photo upload endpoint path.
 * @param {Function} props.uploadModal.onSuccess - Handler invoked when the photo upload succeeds.
 * @param {Function} props.uploadModal.onClose - Handler invoked when the upload modal is
 *   dismissed.
 * @param {object} props.fileUploadModal - PDF file-upload modal wiring.
 * @param {boolean} props.fileUploadModal.show - Whether the PDF file-upload modal is visible.
 * @param {string} props.fileUploadModal.path - PDF file upload endpoint path.
 * @param {Function} props.fileUploadModal.buildFilePhotoUploadPath - Builds the chained photo
 *   upload's init path from the newly created file's id.
 * @param {Function} props.fileUploadModal.onSuccess - Handler invoked when the file upload
 *   succeeds.
 * @param {Function} props.fileUploadModal.onClose - Handler invoked when the file upload modal is
 *   dismissed.
 * @param {object} props.giveDocumentModal - Give-document modal wiring.
 * @param {boolean} props.giveDocumentModal.show - Whether the give-document modal is visible.
 * @param {boolean} props.giveDocumentModal.canGiveHidden - Whether the current user may give this
 *   document even when hidden.
 * @param {Function} props.giveDocumentModal.onClose - Handler invoked when the give-document
 *   modal is dismissed.
 * @returns {React.ReactElement} Rendered modal wiring fragment.
 */
export default function GameDocumentModals({
  document, gameSlug, selectedPhoto, onSelectPhoto,
  uploadModal, fileUploadModal, giveDocumentModal,
}) {
  return (
    <>
      <PhotoUploadModal
        show={uploadModal.show}
        uploadPath={uploadModal.path}
        onClose={uploadModal.onClose}
        onSuccess={uploadModal.onSuccess}
      />
      <PhotoUploadModal
        show={fileUploadModal.show}
        uploadPath={fileUploadModal.path}
        fileUploadOptions={{
          translationPrefix: 'file_upload_modal',
          accept: '.pdf',
          showNameField: true,
          showPhotoField: true,
          photoUploadPathBuilder: fileUploadModal.buildFilePhotoUploadPath,
        }}
        onClose={fileUploadModal.onClose}
        onSuccess={fileUploadModal.onSuccess}
      />
      <PhotoViewModal
        show={selectedPhoto !== null}
        photo={selectedPhoto}
        alt={document?.name}
        onClose={() => onSelectPhoto(null)}
        setProfilePhoto={{ canSetProfilePhoto: false }}
      />
      <GiveDocumentModal
        show={giveDocumentModal.show}
        document={document ?? {}}
        gameSlug={gameSlug}
        canGiveHidden={giveDocumentModal.canGiveHidden}
        onClose={giveDocumentModal.onClose}
      />
    </>
  );
}

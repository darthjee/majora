import PhotoUploadModal from '../../../../common/modals/PhotoUploadModal.jsx';
import LinksEditModal from '../../../../common/modals/LinksEditModal.jsx';

/**
 * Modal wiring for the game edit page: the photo upload modal for the game's own photo, and the
 * links-editing modal (`LinksEditModal`), extracted out of {@link module:GameEdit} to keep its
 * render method within size limits.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.showUploadModal - Whether the photo upload modal is visible.
 * @param {boolean} props.showLinksModal - Whether the links edit modal is visible.
 * @param {string} props.gameSlug - Game slug.
 * @param {Array} props.links - Current list of game links.
 * @param {Function} props.onUploadClose - Handler invoked when the upload modal is dismissed.
 * @param {Function} props.onUploadSuccess - Handler invoked when the photo upload succeeds.
 * @param {Function} props.onLinksClose - Handler invoked when the links modal is dismissed.
 * @param {Function} props.onLinksConfirm - Handler invoked with the new links list when the
 *   links modal is confirmed.
 * @returns {React.ReactElement} Rendered modal wiring fragment.
 */
export default function GameEditModals({
  showUploadModal, showLinksModal, gameSlug, links,
  onUploadClose, onUploadSuccess, onLinksClose, onLinksConfirm,
}) {
  return (
    <>
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={`/games/${gameSlug}/photo_upload.json`}
        onClose={onUploadClose}
        onSuccess={onUploadSuccess}
      />
      <LinksEditModal
        show={showLinksModal}
        links={links}
        onClose={onLinksClose}
        onConfirm={onLinksConfirm}
      />
    </>
  );
}

import { useEffect, useMemo, useState } from 'react';
import DocumentDetailHelper from './helpers/DocumentDetailHelper.jsx';
import GameDocumentController from './controllers/GameDocumentController.js';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import RequestStore from '../../../../utils/requests/RequestStore.js';
import resourceConfig from '../../../../utils/requests/resourceConfig.js';
import FacadeRefresh from '../../../../utils/access/useFacadeRefresh.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Game document detail page (issue #758): loads a single `GameDocument` (via
 * {@link GameDocumentController}, which picks between the public and elevated `full.json`
 * endpoint based on the requester's game-level edit permission) and delegates rendering to
 * {@link DocumentDetailHelper}. Also wires up the photo upload modal (issue #727) and the PDF
 * file-upload modal (issue #726), both gated on the controller's independently-derived
 * `canUploadPhoto` flag, mirroring `GameItem`'s upload modal wiring, and an Edit button linking
 * to the document's `/edit` page, reusing `canUploadPhoto` as the edit gate (there is no separate
 * general "edit" permission for documents).
 *
 * @param {object} [props] - Component props.
 * @param {Function} [props.ControllerClass] - Document controller class to instantiate, mainly
 *   for tests.
 * @returns {React.ReactElement} Game document detail page element.
 */
export default function GameDocument({ ControllerClass = GameDocumentController }) {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canUploadPhoto, setCanUploadPhoto] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);

  const controller = useMemo(
    () => new ControllerClass(setDocument, setLoading, setError, setCanUploadPhoto),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug } = GameDocumentController.getParamsFromHash(currentHash);
  const backHref = `#/games/${gameSlug}/documents`;

  /**
   * Builds an upload-success handler for a given modal setter.
   *
   * @description Purges before refetching: the upload saga doesn't go through
   *   `RequestStore.mutate` (it's a two-step, non-JSON-body saga), so the cache purge must
   *   happen explicitly here, mirroring `GameItem.jsx`'s own `handleUploadSuccess`. Shared by
   *   both the photo and file upload modals (issue #726).
   * @param {Function} setShow - State setter for the modal's visibility.
   * @returns {Function} Success handler to pass as the modal's `onSuccess` prop.
   */
  const buildUploadSuccessHandler = (setShow) => () => {
    setShow(false);
    RequestStore.purge({ resource: 'document' });
    controller.buildEffect()();
  };

  if (loading) return DocumentDetailHelper.renderLoading();
  if (error) return DocumentDetailHelper.renderError(error);

  const editHref = `#/games/${gameSlug}/documents/${document?.id}/edit`;
  const uploadPath = resourceConfig.get('POST', 'document', 'single').regular.path({ gameSlug, id: document?.id });
  const fileUploadPath = resourceConfig.get('POST', 'document', 'file').regular.path({ gameSlug, id: document?.id });

  return (
    <>
      {DocumentDetailHelper.render(
        document, backHref, editHref, canUploadPhoto,
        () => setShowUploadModal(true), () => setShowFileUploadModal(true),
      )}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={uploadPath}
        onClose={() => setShowUploadModal(false)}
        onSuccess={buildUploadSuccessHandler(setShowUploadModal)}
      />
      <PhotoUploadModal
        show={showFileUploadModal}
        uploadPath={fileUploadPath}
        translationPrefix="file_upload_modal"
        accept=".pdf"
        showNameField
        onClose={() => setShowFileUploadModal(false)}
        onSuccess={buildUploadSuccessHandler(setShowFileUploadModal)}
      />
    </>
  );
}

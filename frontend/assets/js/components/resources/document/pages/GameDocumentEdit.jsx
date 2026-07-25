import { useEffect, useMemo, useState } from 'react';
import GameDocumentEditHelper from './helpers/GameDocumentEditHelper.jsx';
import GameDocumentEditController from './controllers/GameDocumentEditController.js';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import RequestStore from '../../../../utils/requests/RequestStore.js';
import resourceConfig from '../../../../utils/requests/resourceConfig.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Game document edit page (issue #727): loads a single `GameDocument` (via
 * {@link GameDocumentEditController}) and delegates rendering to {@link GameDocumentEditHelper}.
 * Photo-upload-only — there is no `name`/`description`/`hidden` editing, since no
 * `PATCH .../documents/:id.json` endpoint exists yet. Mirrors `GameDocument.jsx`'s
 * `canUploadPhoto`/`showUploadModal` state and `PhotoUploadModal` wiring exactly.
 *
 * @param {object} [props] - Component props.
 * @param {Function} [props.ControllerClass] - Document controller class to instantiate, mainly
 *   for tests.
 * @returns {React.ReactElement} Game document edit page element.
 */
export default function GameDocumentEdit({ ControllerClass = GameDocumentEditController }) {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canUploadPhoto, setCanUploadPhoto] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const controller = useMemo(
    () => new ControllerClass(setDocument, setLoading, setError, setCanUploadPhoto),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, id: documentId } = GameDocumentEditController.getParamsFromHash(currentHash);
  const backHref = `#/games/${gameSlug}/documents/${documentId}`;

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    // Purge before refetching: the photo upload saga doesn't go through `RequestStore.mutate`
    // (it's a two-step, non-JSON-body saga), so the cache purge must happen explicitly here,
    // mirroring `GameDocument.jsx`'s own `handleUploadSuccess`.
    RequestStore.purge({ resource: 'document' });
    controller.buildEffect()();
  };

  if (loading) return GameDocumentEditHelper.renderLoading();
  if (error) return GameDocumentEditHelper.renderError(error);

  const uploadPath = resourceConfig.get('POST', 'document', 'single').regular.path({ gameSlug, id: document?.id });

  return (
    <>
      {GameDocumentEditHelper.render(document, backHref, canUploadPhoto, () => setShowUploadModal(true))}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={uploadPath}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}

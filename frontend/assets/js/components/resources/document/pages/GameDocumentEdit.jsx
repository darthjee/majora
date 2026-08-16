import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import GameDocumentEditHelper from './helpers/GameDocumentEditHelper.jsx';
import GameDocumentEditController from './controllers/GameDocumentEditController.js';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import RequestStore from '../../../../utils/requests/RequestStore.js';
import resourceConfig from '../../../../utils/requests/resourceConfig.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Game document edit page (issue #727, opt-in pages editor added in #1129): loads a single
 * `GameDocument` (via {@link GameDocumentEditController}) and delegates rendering to
 * {@link GameDocumentEditHelper}. Still photo-upload-only for the document's own `name`/
 * `description`/`hidden` fields — there is no `PATCH .../documents/:id.json` endpoint. Mirrors
 * `GameDocument.jsx`'s `canUploadPhoto`/`showUploadModal` state and `PhotoUploadModal` wiring
 * exactly.
 *
 * Also owns the page-level Save action (issue #1129): pressing Save always delegates to the
 * pages editor's own imperative `save()` entry point (via `pagesRef`), which no-ops when pages
 * edit mode was never entered — this page's save handler never inspects pages state itself, per
 * the issue's "Save orchestration" section. On failure, `pagesSaveStatus` flips to `'failed'`,
 * surfacing `DocumentPagesSaveFailedAlert`'s Retry (re-invokes the same handler)/Skip (dismisses)
 * actions.
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
  const [pagesSaveStatus, setPagesSaveStatus] = useState('idle');
  const pagesRef = useRef(null);

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

  const handleSave = () => {
    setPagesSaveStatus('saving');

    return pagesRef.current.save().then((result) => {
      setPagesSaveStatus(result.ok ? 'idle' : 'failed');
    });
  };

  if (loading) return GameDocumentEditHelper.renderLoading();
  if (error) return GameDocumentEditHelper.renderError(error);

  const uploadPath = resourceConfig.get('POST', 'document', 'single').regular.path({ gameSlug, id: document?.id });

  return (
    <>
      {GameDocumentEditHelper.render(document, backHref, canUploadPhoto, () => setShowUploadModal(true), {
        gameSlug,
        pagesRef,
        saveStatus: pagesSaveStatus,
        onSave: handleSave,
        onRetrySave: handleSave,
        onSkipSave: () => setPagesSaveStatus('idle'),
      })}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={uploadPath}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}

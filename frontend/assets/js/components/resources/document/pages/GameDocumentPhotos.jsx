import { useEffect, useMemo, useState } from 'react';
import GameDocumentPhotosController from './controllers/GameDocumentPhotosController.js';
import GameDocumentPhotosHelper from './helpers/GameDocumentPhotosHelper.jsx';
import PhotoViewModal from '../../../common/modals/PhotoViewModal.jsx';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Game document photos index page (issue #873): a bespoke, paginated photo grid for a single
 * `GameDocument`'s own `GameDocumentPhoto`s, everyone-accessible, mirroring `CharacterPhotos.jsx`
 * but simpler — no upload button, no profile-photo affordance (there is no "profile photo"
 * concept for a `GameDocument`).
 *
 * @param {object} [props] - Component props.
 * @param {Function} [props.ControllerClass] - Photos controller class to instantiate, mainly
 *   for tests.
 * @returns {React.ReactElement} Game document photos page element.
 */
export default function GameDocumentPhotos({ ControllerClass = GameDocumentPhotosController }) {
  const [photos, setPhotos] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const controller = useMemo(
    () => new ControllerClass(setPhotos, setPagination, setLoading, setError),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const { game_slug: gameSlug, id } = GameDocumentPhotosController.getParamsFromHash(getCurrentHash());
  const basePath = `#/games/${gameSlug}/documents/${id}/photos`;
  const backHref = `#/games/${gameSlug}/documents/${id}`;

  if (loading) return GameDocumentPhotosHelper.renderLoading();
  if (error) return GameDocumentPhotosHelper.renderError(error);

  return (
    <>
      {GameDocumentPhotosHelper.render(photos, pagination, basePath, backHref, setSelectedPhoto)}
      <PhotoViewModal
        show={selectedPhoto !== null}
        photo={selectedPhoto}
        alt=""
        onClose={() => setSelectedPhoto(null)}
        canSetProfilePhoto={false}
      />
    </>
  );
}

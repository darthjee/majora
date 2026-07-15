import { useEffect, useMemo, useState } from 'react';
import GamePhotosController from './controllers/GamePhotosController.js';
import GamePhotosHelper from './helpers/GamePhotosHelper.jsx';
import PhotoUploadModal from '../../../common/PhotoUploadModal.jsx';
import PhotoViewModal from '../../../common/PhotoViewModal.jsx';
import FacadeRefresh from '../../../../utils/access/useFacadeRefresh.js';

/**
 * Game Photos index page.
 *
 * @returns {React.ReactElement} Game photos page element.
 */
export default function GamePhotos() {
  const [photos, setPhotos] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [game, setGame] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const controller = useMemo(
    () => new GamePhotosController(setPhotos, setPagination, setGame, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const gameSlug = GamePhotosController.getGameSlugFromPhotosHash(currentHash);
  const basePath = `#/games/${gameSlug}/photos`;
  const backHref = `#/games/${gameSlug}`;
  const alt = game.name || gameSlug;

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    controller.buildEffect()();
  };

  if (loading) return GamePhotosHelper.renderLoading();
  if (error) return GamePhotosHelper.renderError(error);

  return (
    <>
      {GamePhotosHelper.render(photos, pagination, basePath, backHref, game.can_edit, alt, {
        onOpenUploadModal: () => setShowUploadModal(true),
        onSelectPhoto: setSelectedPhoto,
      })}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={`/games/${gameSlug}/photo_upload.json`}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
      <PhotoViewModal
        show={selectedPhoto !== null}
        photo={selectedPhoto}
        alt={alt}
        onClose={() => setSelectedPhoto(null)}
      />
    </>
  );
}

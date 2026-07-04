import { useEffect, useMemo, useState } from 'react';
import PcCharacterPhotosController, { getPcCharacterPhotosParamsFromHash }
  from './controllers/PcCharacterPhotosController.js';
import PcCharacterPhotosHelper from './helpers/PcCharacterPhotosHelper.jsx';
import PhotoUploadModal from '../elements/PhotoUploadModal.jsx';
import PhotoViewModal from '../elements/PhotoViewModal.jsx';

/**
 * PC character Photos index page.
 *
 * @returns {React.ReactElement} PC character photos page element.
 */
export default function PcCharacterPhotos() {
  const [photos, setPhotos] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [character, setCharacter] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const controller = useMemo(
    () => new PcCharacterPhotosController(setPhotos, setPagination, setCharacter, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const { game_slug: gameSlug, character_id: characterId } = getPcCharacterPhotosParamsFromHash(currentHash);
  const basePath = `#/games/${gameSlug}/pcs/${characterId}/photos`;
  const backHref = `#/games/${gameSlug}/pcs/${characterId}`;
  const alt = character.name || '';

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    controller.buildEffect()();
  };

  if (loading) return PcCharacterPhotosHelper.renderLoading();
  if (error) return PcCharacterPhotosHelper.renderError(error);

  return (
    <>
      {PcCharacterPhotosHelper.render(photos, pagination, basePath, backHref, character.can_edit, alt, {
        onOpenUploadModal: () => setShowUploadModal(true),
        onSelectPhoto: setSelectedPhoto,
      })}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={`/games/${gameSlug}/pcs/${characterId}/photo_upload.json`}
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

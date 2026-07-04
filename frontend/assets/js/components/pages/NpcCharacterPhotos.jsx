import { useEffect, useMemo, useState } from 'react';
import NpcCharacterPhotosController, { getNpcCharacterPhotosParamsFromHash }
  from './controllers/NpcCharacterPhotosController.js';
import NpcCharacterPhotosHelper from './helpers/NpcCharacterPhotosHelper.jsx';
import PhotoUploadModal from '../elements/PhotoUploadModal.jsx';
import PhotoViewModal from '../elements/PhotoViewModal.jsx';

/**
 * NPC character Photos index page.
 *
 * @returns {React.ReactElement} NPC character photos page element.
 */
export default function NpcCharacterPhotos() {
  const [photos, setPhotos] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [character, setCharacter] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const controller = useMemo(
    () => new NpcCharacterPhotosController(setPhotos, setPagination, setCharacter, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const { game_slug: gameSlug, character_id: characterId } = getNpcCharacterPhotosParamsFromHash(currentHash);
  const basePath = `#/games/${gameSlug}/npcs/${characterId}/photos`;
  const backHref = `#/games/${gameSlug}/npcs/${characterId}`;
  const alt = character.name || '';

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    controller.buildEffect()();
  };

  const handleSetProfilePhoto = (photoId) => {
    controller.setProfilePhoto(gameSlug, characterId, photoId).catch(() => {});
  };

  if (loading) return NpcCharacterPhotosHelper.renderLoading();
  if (error) return NpcCharacterPhotosHelper.renderError(error);

  return (
    <>
      {NpcCharacterPhotosHelper.render(photos, pagination, basePath, backHref, character.can_edit, alt, {
        onOpenUploadModal: () => setShowUploadModal(true),
        onSelectPhoto: setSelectedPhoto,
      })}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={`/games/${gameSlug}/npcs/${characterId}/photo_upload.json`}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
      <PhotoViewModal
        show={selectedPhoto !== null}
        photo={selectedPhoto}
        alt={alt}
        onClose={() => setSelectedPhoto(null)}
        canSetProfilePhoto={character.can_edit}
        isProfilePhoto={selectedPhoto?.id === character.profile_photo_id}
        onSetProfilePhoto={handleSetProfilePhoto}
      />
    </>
  );
}

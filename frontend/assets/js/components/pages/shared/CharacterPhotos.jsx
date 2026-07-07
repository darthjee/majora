import { useEffect, useMemo, useState } from 'react';
import Noop from '../../../utils/Noop.js';
import PhotoUploadModal from '../../elements/PhotoUploadModal.jsx';
import PhotoViewModal from '../../elements/PhotoViewModal.jsx';

/**
 * Shared character photos index page component.
 *
 * @description Accepts a type-specific controller class, hash param extractor, photos
 *   helper instance, and character kind as props, so NPC and PC photos pages can share
 *   identical logic.
 * @param {object} props - Component props.
 * @param {Function} props.ControllerClass - Photos controller class to instantiate.
 * @param {Function} props.getParamsFromHash - Hash-parsing function for this character type.
 * @param {import('../helpers/BaseCharacterPhotosHelper.jsx').default} props.PhotosHelper - Photos
 *   helper instance with `render`, `renderLoading`, and `renderError` methods.
 * @param {string} props.characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @returns {React.ReactElement} Character photos page element.
 */
export default function CharacterPhotos({ ControllerClass, getParamsFromHash, PhotosHelper, characterKind }) {
  const [photos, setPhotos] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [character, setCharacter] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const controller = useMemo(
    () => new ControllerClass(setPhotos, setPagination, setCharacter, setLoading, setError),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const { game_slug: gameSlug, character_id: characterId } = getParamsFromHash(currentHash);
  const basePath = `#/games/${gameSlug}/${characterKind}/${characterId}/photos`;
  const backHref = `#/games/${gameSlug}/${characterKind}/${characterId}`;
  const alt = character.name || '';

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    controller.buildEffect()();
  };

  const handleSetProfilePhoto = (photoId) => {
    controller.setProfilePhoto(gameSlug, characterId, photoId).catch(Noop.noop);
  };

  if (loading) return PhotosHelper.renderLoading();
  if (error) return PhotosHelper.renderError(error);

  return (
    <>
      {PhotosHelper.render(photos, pagination, basePath, backHref, character.can_edit, alt, {
        onOpenUploadModal: () => setShowUploadModal(true),
        onSelectPhoto: setSelectedPhoto,
      })}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={`/games/${gameSlug}/${characterKind}/${characterId}/photo_upload.json`}
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

import { useEffect, useMemo, useState } from 'react';
import PhotoUploadModal from '../../../../common/PhotoUploadModal.jsx';
import PhotoViewModal from '../../../../common/PhotoViewModal.jsx';
import ProfilePhotoSetModal from '../../../../common/ProfilePhotoSetModal.jsx';
import ErrorAlert from '../../../../common/ErrorAlert.jsx';
import Translator from '../../../../../i18n/Translator.js';
import FacadeRefresh from '../../../../../utils/access/useFacadeRefresh.js';

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
  const [profilePhotoSet, setProfilePhotoSet] = useState(null);
  const [actionError, setActionError] = useState('');

  const controller = useMemo(
    () => new ControllerClass(setPhotos, setPagination, setCharacter, setLoading, setError),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const { game_slug: gameSlug, character_id: characterId } = getParamsFromHash(currentHash);
  const basePath = `#/games/${gameSlug}/${characterKind}/${characterId}/photos`;
  const backHref = `#/games/${gameSlug}/${characterKind}/${characterId}`;
  const alt = character.name || '';
  const canUploadPhoto = character.can_edit || character.is_player
    || (character.is_pc && character.is_staff);

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    controller.buildEffect()();
  };

  const handleSetProfilePhoto = (photoId) => {
    setActionError('');
    const photo = photos.find((p) => p.id === photoId) ?? selectedPhoto;

    controller.setProfilePhoto(gameSlug, characterId, photoId)
      .then(() => setProfilePhotoSet(photo))
      .catch(() => setActionError(Translator.t('character_photos_page.set_profile_photo_error')));
  };

  if (loading) return PhotosHelper.renderLoading();
  if (error) return PhotosHelper.renderError(error);

  return (
    <>
      {actionError && <ErrorAlert error={actionError} />}
      {PhotosHelper.render(
        photos, pagination, basePath, backHref, canUploadPhoto, character.can_edit, alt,
        character.profile_photo_id, {
          onOpenUploadModal: () => setShowUploadModal(true),
          onSelectPhoto: setSelectedPhoto,
          onSetProfilePhoto: handleSetProfilePhoto,
        },
      )}
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
      <ProfilePhotoSetModal
        show={profilePhotoSet !== null}
        photo={profilePhotoSet}
        alt={alt}
        onClose={() => setProfilePhotoSet(null)}
      />
    </>
  );
}

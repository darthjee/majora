import { useEffect, useMemo, useState } from 'react';
import PhotoUploadModal from '../../../../common/modals/PhotoUploadModal.jsx';
import PhotoViewModal from '../../../../common/modals/PhotoViewModal.jsx';
import ProfilePhotoSetModal from '../../../../common/modals/ProfilePhotoSetModal.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import DeletePhotoConfirmModal from '../elements/DeletePhotoConfirmModal.jsx';
import Translator from '../../../../../i18n/Translator.js';
import FacadeRefresh from '../../../../../utils/access/useFacadeRefresh.js';
import resourceConfig from '../../../../../utils/requests/resourceConfig.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';
import resourceName from './characterResourceName.js';
import useProfilePhotoActions from './hooks/useProfilePhotoActions.js';

/**
 * Private hook bundling the delete-photo confirmation flow's `pendingDeletePhoto` state
 * together with its request/confirm handlers. Shares its error slot with
 * {@link useProfilePhotoActions} (via the given `setActionError`), mirroring the original
 * single shared `actionError` state, rather than owning an independent error of its own.
 *
 * @param {object} controller - Photos controller instance, exposing `deletePhoto`.
 * @param {string} gameSlug - Game slug the character belongs to.
 * @param {string|number} characterId - Character id.
 * @param {object[]} photos - Currently loaded photos array.
 * @param {object|null} selectedPhoto - Currently selected photo (photo view modal), used as a
 *   fallback when the requested id isn't found in `photos`.
 * @param {Function} setSelectedPhoto - Raw `setSelectedPhoto` setter, cleared on a successful
 *   delete (the photo view modal can't stay open pointing at a deleted photo).
 * @param {Function} setActionError - Shared error-message setter (from
 *   {@link useProfilePhotoActions}).
 * @returns {{pendingDeletePhoto: object|null, setPendingDeletePhoto: Function,
 *   handleRequestDeletePhoto: Function, handleConfirmDeletePhoto: Function}} Delete-photo flow
 *   state and handlers.
 */
function useDeletePhotoFlow(
  controller, gameSlug, characterId, photos, selectedPhoto, setSelectedPhoto, setActionError,
) {
  const [pendingDeletePhoto, setPendingDeletePhoto] = useState(null);

  const handleRequestDeletePhoto = (photoId) => {
    const photo = photos.find((p) => p.id === photoId) ?? selectedPhoto;
    setPendingDeletePhoto(photo);
  };

  const handleConfirmDeletePhoto = () => {
    setActionError('');
    return controller.deletePhoto(gameSlug, characterId, pendingDeletePhoto.id)
      .then(() => {
        setSelectedPhoto(null);
        setPendingDeletePhoto(null);
      })
      .catch(() => {
        setActionError(Translator.t('character_photos_page.delete_photo_error'));
        setPendingDeletePhoto(null);
      });
  };

  return {
    pendingDeletePhoto, setPendingDeletePhoto, handleRequestDeletePhoto, handleConfirmDeletePhoto,
  };
}

/**
 * Private hook bundling the photos page's load state (photos/pagination/character/loading/
 * error) together with the controller instance and its effect/facade-refresh wiring.
 *
 * @param {Function} ControllerClass - Photos controller class to instantiate.
 * @returns {{photos: object[], pagination: object, character: object, loading: boolean,
 *   error: string, controller: object}} Load state and controller instance.
 */
function useCharacterPhotosLoad(ControllerClass) {
  const [photos, setPhotos] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [character, setCharacter] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new ControllerClass(setPhotos, setPagination, setCharacter, setLoading, setError),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  return {
    photos, pagination, character, loading, error, controller,
  };
}

/**
 * Private hook wrapping the photo-upload modal's `show` state together with its open/close/
 * success handlers (refetching the page's data on a successful upload).
 *
 * @param {object} controller - Photos controller instance, exposing `buildEffect`.
 * @returns {{showUploadModal: boolean, openUploadModal: Function, closeUploadModal: Function,
 *   handleUploadSuccess: Function}} Photo-upload modal state and handlers.
 */
function useCharacterPhotosUploadModal(controller) {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    controller.buildEffect()();
  };

  return {
    showUploadModal,
    openUploadModal: () => setShowUploadModal(true),
    closeUploadModal: () => setShowUploadModal(false),
    handleUploadSuccess,
  };
}

/**
 * Builds the handlers object passed into `PhotosHelper.render`.
 *
 * @param {object} params - Handler-building params.
 * @param {object} params.uploadModal - `useCharacterPhotosUploadModal()` result.
 * @param {Function} params.setSelectedPhoto - Raw `setSelectedPhoto` setter.
 * @param {object} params.profilePhotoActions - `useProfilePhotoActions()` result.
 * @param {object} params.deleteFlow - `useDeletePhotoFlow()` result.
 * @returns {object} Handlers object for `PhotosHelper.render`.
 */
function buildCharacterPhotosHandlers({
  uploadModal, setSelectedPhoto, profilePhotoActions, deleteFlow,
}) {
  return {
    onOpenUploadModal: uploadModal.openUploadModal,
    onSelectPhoto: setSelectedPhoto,
    onSetProfilePhoto: profilePhotoActions.handleSetProfilePhoto,
    onDelete: deleteFlow.handleRequestDeletePhoto,
  };
}

/**
 * Renders the photo-upload, photo-view, profile-photo-set, and delete-photo-confirmation
 * modals for {@link CharacterPhotos}.
 *
 * @param {object} props - Component props.
 * @param {object} props.character - Currently loaded character context.
 * @param {string} props.alt - Alt text for the photos (the character's name).
 * @param {string} props.gameSlug - Game slug the character belongs to.
 * @param {string|number} props.characterId - Character id.
 * @param {string} props.characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @param {object} props.uploadModal - `{showUploadModal, openUploadModal, closeUploadModal,
 *   handleUploadSuccess}`, the photo-upload modal's state and handlers.
 * @param {object} props.profilePhotoActions - `useProfilePhotoActions()` result.
 * @param {object} props.deleteFlow - `useDeletePhotoFlow()` result.
 * @param {object|null} props.selectedPhoto - Currently selected photo (photo view modal).
 * @param {Function} props.setSelectedPhoto - Raw `setSelectedPhoto` setter.
 * @returns {React.ReactElement} The photos page's modals.
 */
function CharacterPhotosModals({
  character, alt, gameSlug, characterId, characterKind, uploadModal, profilePhotoActions, deleteFlow,
  selectedPhoto, setSelectedPhoto,
}) {
  return (
    <>
      <PhotoUploadModal
        show={uploadModal.showUploadModal}
        uploadPath={resourceConfig.get('POST', resourceName(characterKind), 'single').regular.path(
          { gameSlug, id: characterId },
        )}
        onClose={uploadModal.closeUploadModal}
        onSuccess={uploadModal.handleUploadSuccess}
      />
      <PhotoViewModal
        show={selectedPhoto !== null}
        photo={selectedPhoto}
        alt={alt}
        onClose={() => setSelectedPhoto(null)}
        setProfilePhoto={{
          canSetProfilePhoto: character.can_set_profile_photo,
          isProfilePhoto: selectedPhoto?.id === character.photo_id,
          onSetProfilePhoto: profilePhotoActions.handleSetProfilePhoto,
        }}
        deletePhoto={{ canDelete: character.can_delete_photo, onDelete: deleteFlow.handleRequestDeletePhoto }}
      />
      <ProfilePhotoSetModal
        show={profilePhotoActions.profilePhotoSet !== null}
        photo={profilePhotoActions.profilePhotoSet}
        alt={alt}
        onClose={() => profilePhotoActions.setProfilePhotoSet(null)}
      />
      <DeletePhotoConfirmModal
        show={deleteFlow.pendingDeletePhoto !== null}
        photo={deleteFlow.pendingDeletePhoto}
        onConfirm={deleteFlow.handleConfirmDeletePhoto}
        onCancel={() => deleteFlow.setPendingDeletePhoto(null)}
      />
    </>
  );
}

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
  const {
    photos, pagination, character, loading, error, controller,
  } = useCharacterPhotosLoad(ControllerClass);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, character_id: characterId } = getParamsFromHash(currentHash);
  const basePath = `#/games/${gameSlug}/${characterKind}/${characterId}/photos`;
  const backHref = `#/games/${gameSlug}/${characterKind}/${characterId}`;
  const alt = character.name || '';
  const canUploadPhoto = character.can_edit || character.is_player || character.is_staff;

  const uploadModal = useCharacterPhotosUploadModal(controller);
  const profilePhotoActions = useProfilePhotoActions({
    requestSetProfilePhoto: (photoId) => controller.setProfilePhoto(gameSlug, characterId, photoId),
    getPhotos: () => photos,
    selectedPhoto,
  });
  const deleteFlow = useDeletePhotoFlow(
    controller, gameSlug, characterId, photos, selectedPhoto, setSelectedPhoto, profilePhotoActions.setActionError,
  );

  if (loading) return PhotosHelper.renderLoading();
  if (error) return PhotosHelper.renderError(error);

  const handlers = buildCharacterPhotosHandlers({
    uploadModal, setSelectedPhoto, profilePhotoActions, deleteFlow,
  });

  return (
    <>
      {profilePhotoActions.actionError && <ErrorAlert error={profilePhotoActions.actionError} />}
      {PhotosHelper.render(
        photos, pagination, basePath, backHref, {
          canUploadPhoto,
          canSetProfilePhoto: character.can_set_profile_photo,
          canDeletePhoto: character.can_delete_photo,
        }, alt, character.photo_id, handlers,
      )}
      <CharacterPhotosModals
        character={character}
        alt={alt}
        gameSlug={gameSlug}
        characterId={characterId}
        characterKind={characterKind}
        uploadModal={uploadModal}
        profilePhotoActions={profilePhotoActions}
        deleteFlow={deleteFlow}
        selectedPhoto={selectedPhoto}
        setSelectedPhoto={setSelectedPhoto}
      />
    </>
  );
}

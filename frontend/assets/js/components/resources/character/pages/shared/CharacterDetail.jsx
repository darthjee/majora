import { useEffect, useMemo, useState } from 'react';
import CharacterHelper from '../helpers/CharacterHelper.jsx';
import AuthEvents from '../../../../../utils/auth/AuthEvents.js';
import FacadeRefresh from '../../../../../utils/access/useFacadeRefresh.js';
import PhotoUploadModal from '../../../../common/modals/PhotoUploadModal.jsx';
import PhotoViewModal from '../../../../common/modals/PhotoViewModal.jsx';
import ProfilePhotoSetModal from '../../../../common/modals/ProfilePhotoSetModal.jsx';
import MoneyEditModal from '../../../../common/modals/MoneyEditModal.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import resourceConfig from '../../../../../utils/requests/resourceConfig.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';
import resourceName from './characterResourceName.js';
import useProfilePhotoActions from './hooks/useProfilePhotoActions.js';

/**
 * Default extension hook, used when a character kind has no extra
 * behaviour to plug into the detail page (e.g. PCs, which have no slain modal).
 *
 * @returns {{handlers: object, modal: null}} Empty extension result.
 */
function useNoExtra() {
  return { handlers: {}, modal: null };
}

/**
 * Private hook bundling the money-edit modal's `show` state together with its confirm handler,
 * which PATCHes the character's money total and refreshes the character on success.
 *
 * @param {object} controller - Detail controller instance, exposing `updateCharacterMoney` and
 *   `buildEffect`.
 * @param {string} gameSlug - Game slug the character belongs to.
 * @param {object|null} character - Currently loaded character, or `null` while loading.
 * @returns {{showMoneyModal: boolean, openMoneyModal: Function, closeMoneyModal: Function,
 *   handleMoneyConfirm: Function}} Money modal state and handlers.
 */
function useCharacterMoneyModal(controller, gameSlug, character) {
  const [showMoneyModal, setShowMoneyModal] = useState(false);

  const handleMoneyConfirm = (newTotal) => {
    const token = AuthStorage.getToken();

    return controller.updateCharacterMoney(gameSlug, character.id, token, newTotal).then(() => {
      setShowMoneyModal(false);
      controller.buildEffect()();
    });
  };

  return {
    showMoneyModal,
    openMoneyModal: () => setShowMoneyModal(true),
    closeMoneyModal: () => setShowMoneyModal(false),
    handleMoneyConfirm,
  };
}

/**
 * Private hook bundling the photo-upload modal's `show` state together with the selected-photo
 * (view modal) state and the upload success handler, which purges the resource cache (the photo
 * upload saga doesn't go through `RequestStore.mutate`) and refreshes the character.
 *
 * @param {object} controller - Detail controller instance, exposing `buildEffect`.
 * @param {string} gameSlug - Game slug the character belongs to.
 * @param {string|number} characterId - Character id.
 * @param {string} characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @returns {{showUploadModal: boolean, openUploadModal: Function, closeUploadModal: Function,
 *   handleUploadSuccess: Function, selectedPhoto: object|null, setSelectedPhoto: Function,
 *   uploadPath: string}} Photo-upload/view state and handlers.
 */
function useCharacterPhotoActions(controller, gameSlug, characterId, characterKind) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    // Purge before refetching: the photo upload saga doesn't go through `RequestStore.mutate`
    // (it's a two-step, non-JSON-body saga), so the cache purge must happen explicitly here,
    // before `buildEffect()()`'s refetch, or that refetch would re-serve the pre-upload cache.
    RequestStore.purge({ resource: resourceName(characterKind) });
    controller.buildEffect()();
  };

  const uploadPath = resourceConfig.get('POST', resourceName(characterKind), 'single').regular.path(
    { gameSlug, id: characterId },
  );

  return {
    showUploadModal,
    openUploadModal: () => setShowUploadModal(true),
    closeUploadModal: () => setShowUploadModal(false),
    handleUploadSuccess,
    selectedPhoto,
    setSelectedPhoto,
    uploadPath,
  };
}

/**
 * Renders the photo-upload, money-edit, photo-view, profile-photo-set, and extra (type-specific)
 * modals for {@link CharacterDetail}.
 *
 * @param {object} props - Component props.
 * @param {object} props.character - Currently loaded character.
 * @param {object} props.photoActions - `useCharacterPhotoActions()` result.
 * @param {object} props.moneyModal - `useCharacterMoneyModal()` result.
 * @param {object} props.profilePhotoActions - `useProfilePhotoActions()` result.
 * @param {React.ReactElement|null} props.extraModal - Extra, type-specific modal (e.g. NPC's
 *   slain confirm modal), or `null`.
 * @returns {React.ReactElement} The detail page's modals.
 */
function CharacterDetailModals({
  character, photoActions, moneyModal, profilePhotoActions, extraModal,
}) {
  return (
    <>
      <PhotoUploadModal
        show={photoActions.showUploadModal}
        uploadPath={photoActions.uploadPath}
        onClose={photoActions.closeUploadModal}
        onSuccess={photoActions.handleUploadSuccess}
      />
      <MoneyEditModal
        show={moneyModal.showMoneyModal}
        money={character.money}
        context="character"
        gameType={character.game_type}
        onClose={moneyModal.closeMoneyModal}
        onConfirm={moneyModal.handleMoneyConfirm}
      />
      <PhotoViewModal
        show={photoActions.selectedPhoto !== null}
        photo={photoActions.selectedPhoto}
        alt={character.name}
        onClose={() => photoActions.setSelectedPhoto(null)}
        setProfilePhoto={{
          canSetProfilePhoto: character.can_set_profile_photo,
          isProfilePhoto: photoActions.selectedPhoto?.id === character.photo_id,
          onSetProfilePhoto: profilePhotoActions.handleSetProfilePhoto,
        }}
      />
      <ProfilePhotoSetModal
        show={profilePhotoActions.profilePhotoSet !== null}
        photo={profilePhotoActions.profilePhotoSet}
        alt={character.name}
        onClose={() => profilePhotoActions.setProfilePhotoSet(null)}
      />
      {extraModal}
    </>
  );
}

/**
 * Shared character detail page component.
 *
 * @description Accepts a type-specific controller class, hash param extractor, and
 *   character kind as props, so NPC and PC detail pages can share identical logic.
 *   NPC-only behaviour (the slain confirm modal) plugs in via the `useExtra` hook prop,
 *   which returns extra render handlers (merged into {@link CharacterHelper#render}'s
 *   handlers) and an extra modal element, without forcing PC to carry unused slain logic.
 * @param {object} props - Component props.
 * @param {Function} props.ControllerClass - Detail controller class to instantiate.
 * @param {Function} props.getParamsFromHash - Hash-parsing function for this character type.
 * @param {string} props.characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @param {Function} [props.useExtra] - Extension hook returning `{handlers, modal}`,
 *   invoked with `(character, controller)`.
 * @returns {React.ReactElement} Character detail page element.
 */
export default function CharacterDetail({
  ControllerClass, getParamsFromHash, characterKind, useExtra = useNoExtra,
}) {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new ControllerClass(setCharacter, setLoading, setError),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  useEffect(() => {
    const handleAuthChanged = () => controller.buildEffect()();
    AuthEvents.subscribe(handleAuthChanged);
    return () => AuthEvents.unsubscribe(handleAuthChanged);
  }, [controller]);

  const { handlers: extraHandlers, modal: extraModal } = useExtra(character, controller);

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug } = getParamsFromHash(currentHash);
  const backHref = `#/games/${gameSlug}/${characterKind}`;

  const moneyModal = useCharacterMoneyModal(controller, gameSlug, character);
  const photoActions = useCharacterPhotoActions(controller, gameSlug, character?.id, characterKind);
  const profilePhotoActions = useProfilePhotoActions({
    requestSetProfilePhoto: (photoId) => controller.setProfilePhoto(gameSlug, character?.id, photoId),
    getPhotos: () => character?.photos ?? [],
    selectedPhoto: photoActions.selectedPhoto,
    onSuccess: () => controller.buildEffect()(),
  });

  if (loading) return CharacterHelper.renderLoading();
  if (error) return CharacterHelper.renderError(error);

  return (
    <>
      {profilePhotoActions.actionError && <ErrorAlert error={profilePhotoActions.actionError} />}
      {CharacterHelper.render(character, backHref, {
        onOpenUploadModal: photoActions.openUploadModal,
        onOpenMoneyModal: moneyModal.openMoneyModal,
        onSelectPhoto: photoActions.setSelectedPhoto,
        onSetProfilePhoto: profilePhotoActions.handleSetProfilePhoto,
        ...extraHandlers,
      })}
      <CharacterDetailModals
        character={character}
        photoActions={photoActions}
        moneyModal={moneyModal}
        profilePhotoActions={profilePhotoActions}
        extraModal={extraModal}
      />
    </>
  );
}

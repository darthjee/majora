import {
  useEffect, useMemo, useState,
} from 'react';
import GameNpcNewController from './controllers/GameNpcNewController.js';
import Noop from '../../../../utils/Noop.js';
import GameNpcNewHelper from './helpers/GameNpcNewHelper.jsx';
import LinksEditModal from '../../../common/modals/LinksEditModal.jsx';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import MoneyEditModal from '../../../common/modals/MoneyEditModal.jsx';
import getCurrentHash from '../../../../utils/routing/currentHash.js';
import useFormState from '../../../../utils/useFormState.js';
import useLinksModal from './shared/hooks/useLinksModal.js';
import useMoneyModal from './shared/hooks/useMoneyModal.js';

/**
 * Private hook wrapping the photo preview object URL for a pending (not-yet-uploaded) photo
 * file, creating it on each new `photoFile` and revoking the previous one, so the caller
 * doesn't have to manage the `URL.createObjectURL`/`URL.revokeObjectURL` lifecycle inline.
 *
 * @param {File|null} photoFile - Pending photo file, or `null` when none is selected.
 * @returns {string|null} Object URL for `photoFile`, or `null` when `photoFile` is `null`.
 */
function usePhotoPreview(photoFile) {
  const photoPreviewUrl = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : null),
    [photoFile],
  );

  useEffect(() => () => {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
  }, [photoPreviewUrl]);

  return photoPreviewUrl;
}

/**
 * Private hook wrapping the deferred photo-upload modal's `show`/`photoFile` state together
 * with its open/close/confirm handlers.
 *
 * @returns {{showUploadModal: boolean, photoFile: File|null, openUploadModal: Function,
 *   closeUploadModal: Function, confirmUploadModal: Function}} Deferred photo-upload modal
 *   state and handlers.
 */
function usePhotoUploadModal() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);

  return {
    showUploadModal,
    photoFile,
    openUploadModal: () => setShowUploadModal(true),
    closeUploadModal: () => setShowUploadModal(false),
    confirmUploadModal: (file) => {
      setPhotoFile(file);
      setShowUploadModal(false);
    },
  };
}

/**
 * Private hook bundling the NPC creation form's primitive state (submit status/errors, the
 * created character id, the game's type, and the full-editor flag) together with the
 * `useFormState`-backed field values, so the main component only needs a single call to set up
 * its form state.
 *
 * @returns {object} `{fieldErrors, setFieldErrors, status, setStatus, characterId,
 *   setCharacterId, gameType, setGameType, isFullEditor, setIsFullEditor, state, setField,
 *   handleChange, handleCheckboxChange}` — the primitive state pairs, plus `useFormState`'s
 *   own return value spread in.
 */
function useNpcCreationState() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [characterId, setCharacterId] = useState(null);
  const [gameType, setGameType] = useState('dnd');
  const [isFullEditor, setIsFullEditor] = useState(false);
  const formState = useFormState({
    name: '',
    role: '',
    description: '',
    privateDescription: '',
    hidden: false,
    incognito: false,
    money: '0',
    privateAllegiance: 'neutral',
    publicAllegiance: 'neutral',
  });

  return {
    fieldErrors,
    setFieldErrors,
    status,
    setStatus,
    characterId,
    setCharacterId,
    gameType,
    setGameType,
    isFullEditor,
    setIsFullEditor,
    ...formState,
  };
}

/**
 * Builds the handlers object passed into {@link GameNpcNewHelper#render}.
 *
 * @param {object} params - Handler-building params.
 * @param {object} params.linksModal - `useLinksModal()` result.
 * @param {object} params.uploadModal - `usePhotoUploadModal()` result.
 * @param {object} params.moneyModal - `useMoneyModal()` result.
 * @param {Function} params.handleChange - `useFormState`'s `handleChange` field factory.
 * @param {Function} params.handleCheckboxChange - `useFormState`'s `handleCheckboxChange` field
 *   factory.
 * @param {Function} params.handleSubmit - Form submit handler.
 * @param {Function} params.handleRetryPhotoUpload - Retry-photo-upload handler.
 * @param {Function} params.handleSkipPhotoUpload - Skip-photo-upload handler.
 * @returns {object} Handlers object for `GameNpcNewHelper.render`.
 */
function buildGameNpcNewHandlers({
  linksModal, uploadModal, moneyModal, handleChange, handleCheckboxChange,
  handleSubmit, handleRetryPhotoUpload, handleSkipPhotoUpload,
}) {
  return {
    onSubmit: handleSubmit,
    onNameChange: handleChange('name'),
    onRoleChange: handleChange('role'),
    onDescriptionChange: handleChange('description'),
    onPrivateDescriptionChange: handleChange('privateDescription'),
    onOpenLinksModal: linksModal.openLinksModal,
    onOpenUploadModal: uploadModal.openUploadModal,
    onOpenMoneyModal: moneyModal.openMoneyModal,
    onHiddenChange: handleCheckboxChange('hidden'),
    onIncognitoChange: handleCheckboxChange('incognito'),
    onPrivateAllegianceChange: handleChange('privateAllegiance'),
    onPublicAllegianceChange: handleChange('publicAllegiance'),
    onRetryPhotoUpload: handleRetryPhotoUpload,
    onSkipPhotoUpload: handleSkipPhotoUpload,
  };
}

/**
 * Renders the links, deferred photo-upload, and money edit modals for {@link GameNpcNew}.
 *
 * @param {object} props - Component props.
 * @param {object} props.linksModal - `useLinksModal()` result.
 * @param {object} props.uploadModal - `usePhotoUploadModal()` result.
 * @param {object} props.moneyModal - `useMoneyModal()` result.
 * @param {string} props.money - Current money field value, for the money modal.
 * @param {string} props.gameType - Game type, for the money modal.
 * @returns {React.ReactElement} The three modals.
 */
function GameNpcNewModals({
  linksModal, uploadModal, moneyModal, money, gameType,
}) {
  return (
    <>
      <LinksEditModal
        show={linksModal.showLinksModal}
        links={linksModal.links}
        onClose={linksModal.closeLinksModal}
        onConfirm={linksModal.confirmLinksModal}
      />
      <PhotoUploadModal
        show={uploadModal.showUploadModal}
        deferred
        onFileConfirmed={uploadModal.confirmUploadModal}
        onClose={uploadModal.closeUploadModal}
      />
      <MoneyEditModal
        show={moneyModal.showMoneyModal}
        money={money}
        context="character"
        gameType={gameType}
        onClose={moneyModal.closeMoneyModal}
        onConfirm={moneyModal.confirmMoneyModal}
      />
    </>
  );
}

/**
 * Game NPC creation page.
 *
 * @returns {React.ReactElement} Game NPC creation page element.
 */
export default function GameNpcNew() {
  const {
    fieldErrors, setFieldErrors, status, setStatus, characterId, setCharacterId,
    gameType, setGameType, isFullEditor, setIsFullEditor,
    state: fields, setField, handleChange, handleCheckboxChange,
  } = useNpcCreationState();

  const linksModal = useLinksModal();
  const moneyModal = useMoneyModal(setField);
  const uploadModal = usePhotoUploadModal();

  const controller = useMemo(
    () => new GameNpcNewController(Noop.noop, setFieldErrors, null, null, setGameType, null, setIsFullEditor),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const currentHash = getCurrentHash();
  const gameSlug = GameNpcNewController.getGameSlugFromNpcNewHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  const photoPreviewUrl = usePhotoPreview(uploadModal.photoFile);

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    { ...fields, links: linksModal.links, photoFile: uploadModal.photoFile },
    { setStatus, setFieldErrors, setCharacterId },
    isFullEditor,
  );

  const handleRetryPhotoUpload = () => controller.retryPhotoUpload(
    gameSlug,
    characterId,
    uploadModal.photoFile,
    { setStatus, setCharacterId },
  );

  const handleSkipPhotoUpload = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = `/games/${gameSlug}/npcs/${characterId}`;
    }
  };

  const handlers = buildGameNpcNewHandlers({
    linksModal, uploadModal, moneyModal, handleChange, handleCheckboxChange,
    handleSubmit, handleRetryPhotoUpload, handleSkipPhotoUpload,
  });

  return (
    <>
      {GameNpcNewHelper.render(
        {
          ...fields, links: linksModal.links, gameType, isFullEditor, status, fieldErrors, photo_path: photoPreviewUrl,
        },
        handlers,
      )}
      <GameNpcNewModals
        linksModal={linksModal}
        uploadModal={uploadModal}
        moneyModal={moneyModal}
        money={fields.money}
        gameType={gameType}
      />
    </>
  );
}

import { useEffect, useMemo, useState } from 'react';
import CharacterPossessionNewController from '../controllers/CharacterPossessionNewController.js';
import GamePossessionNewHelper from '../../../possession/pages/helpers/GamePossessionNewHelper.jsx';
import PhotoUploadModal from '../../../../common/modals/PhotoUploadModal.jsx';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';
import useFormState from '../../../../../utils/useFormState.js';

/**
 * Shared PC/NPC possession creation page component (issue #1076), parameterized by
 * `characterKind`, mirroring `CharacterItemNew.jsx`'s existing PC/NPC-sharing precedent. Reuses
 * `GamePossessionNewHelper` as-is for rendering — the `possession` `showTypeConfig` entry's
 * new-mode slots (including the photo-upload-failed retry/skip alert) are already generic over
 * `handlers`, with no game-only href baked in, so no character-scoped copy is needed.
 *
 * @param {object} props - Component props.
 * @param {string} props.characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @returns {React.ReactElement} Character possession creation page element.
 */
export default function CharacterPossessionNew({ characterKind }) {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [gamePossessionId, setGamePossessionId] = useState(null);
  const { state: fields, handleChange, handleCheckboxChange } = useFormState({
    name: '', description: '', hidden: false,
  });

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, character_id: characterId } = BasePageController.extractParams(
    `/games/:game_slug/${characterKind}/:character_id/possessions/new`, currentHash, ['game_slug', 'character_id'],
  );

  const controller = useMemo(
    () => new CharacterPossessionNewController(characterKind, Noop.noop, setFieldErrors),
    [characterKind],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const photoPreviewUrl = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : null),
    [photoFile],
  );

  useEffect(() => () => {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
  }, [photoPreviewUrl]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    characterId,
    { ...fields, photoFile },
    {
      setStatus, setFieldErrors, setGamePossessionId,
    },
  );

  const handleRetryPhotoUpload = () => controller.retryPhotoUpload(
    gameSlug,
    characterId,
    gamePossessionId,
    photoFile,
    { setStatus, setGamePossessionId },
  );

  const handleSkipPhotoUpload = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = `/games/${gameSlug}/${characterKind}/${characterId}/possessions`;
    }
  };

  return (
    <>
      {GamePossessionNewHelper.render(
        {
          ...fields, status, fieldErrors, photo_path: photoPreviewUrl,
        },
        {
          onSubmit: handleSubmit,
          onNameChange: handleChange('name'),
          onDescriptionChange: handleChange('description'),
          onHiddenChange: handleCheckboxChange('hidden'),
          onOpenUploadModal: () => setShowUploadModal(true),
          onRetryPhotoUpload: handleRetryPhotoUpload,
          onSkipPhotoUpload: handleSkipPhotoUpload,
        },
      )}
      <PhotoUploadModal
        show={showUploadModal}
        deferred
        onFileConfirmed={(file) => {
          setPhotoFile(file);
          setShowUploadModal(false);
        }}
        onClose={() => setShowUploadModal(false)}
      />
    </>
  );
}

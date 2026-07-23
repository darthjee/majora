import { useEffect, useMemo, useState } from 'react';
import CharacterItemNewController from '../controllers/CharacterItemNewController.js';
import CharacterItemNewHelper from '../helpers/CharacterItemNewHelper.jsx';
import PhotoUploadModal from '../../../../common/modals/PhotoUploadModal.jsx';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../../utils/Noop.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';
import useFormState from '../../../../../utils/useFormState.js';

/**
 * Shared PC/NPC item creation page component (issue #714), parameterized by `characterKind`,
 * following `CharacterItemsHelper`'s existing PC/NPC-sharing precedent.
 *
 * @param {object} props - Component props.
 * @param {string} props.characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @returns {React.ReactElement} Character item creation page element.
 */
export default function CharacterItemNew({ characterKind }) {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [gameItemId, setGameItemId] = useState(null);
  const { state: fields, handleChange, handleCheckboxChange } = useFormState({
    name: '', description: '', hidden: false,
  });

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, character_id: characterId } = BasePageController.extractParams(
    `/games/:game_slug/${characterKind}/:character_id/items/new`, currentHash, ['game_slug', 'character_id'],
  );

  const controller = useMemo(
    () => new CharacterItemNewController(characterKind, Noop.noop, setFieldErrors),
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
      setStatus, setFieldErrors, setGameItemId,
    },
  );

  const handleRetryPhotoUpload = () => controller.retryPhotoUpload(
    gameSlug,
    characterId,
    gameItemId,
    photoFile,
    { setStatus, setGameItemId },
  );

  const handleSkipPhotoUpload = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = `/games/${gameSlug}/${characterKind}/${characterId}/items`;
    }
  };

  return (
    <>
      {CharacterItemNewHelper.render(
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

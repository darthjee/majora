import { useEffect, useMemo, useState } from 'react';
import GamePossessionNewController from './controllers/GamePossessionNewController.js';
import GamePossessionNewHelper from './helpers/GamePossessionNewHelper.jsx';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import BasePageController from '../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../utils/Noop.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';
import useFormState from '../../../../utils/useFormState.js';

/**
 * Game-level possession creation page (issue #1074): creates a bare `GamePossession` with no
 * owning character, gated to dm/admin/staff/player via `can_create_possession`. Mirrors
 * `GameItemNew`'s form/deferred-photo-upload wiring.
 *
 * @returns {React.ReactElement} Game possession creation page element.
 */
export default function GamePossessionNew() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [gamePossessionId, setGamePossessionId] = useState(null);
  const { state: fields, handleChange, handleCheckboxChange } = useFormState({
    name: '', description: '', hidden: false,
  });

  const currentHash = getCurrentHash();
  const gameSlug = BasePageController.extractParam(
    '/games/:game_slug/possessions/new', 'game_slug', currentHash,
  );

  const controller = useMemo(() => new GamePossessionNewController(Noop.noop, setFieldErrors), []);

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
    { ...fields, photoFile },
    {
      setStatus, setFieldErrors, setGamePossessionId,
    },
  );

  const handleRetryPhotoUpload = () => controller.retryPhotoUpload(
    gameSlug,
    gamePossessionId,
    photoFile,
    { setStatus, setGamePossessionId },
  );

  const handleSkipPhotoUpload = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = `/games/${gameSlug}/possessions`;
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

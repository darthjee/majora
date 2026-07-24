import { useEffect, useMemo, useState } from 'react';
import GameItemNewController from './controllers/GameItemNewController.js';
import GameItemNewHelper from './helpers/GameItemNewHelper.jsx';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import BasePageController from '../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../utils/Noop.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';
import useFormState from '../../../../utils/useFormState.js';

/**
 * Game-level item creation page (issue #784): creates a bare `GameItem` with no owning
 * `CharacterItem`, gated to dm/admin/staff via `can_create_item`. Mirrors
 * `CharacterItemNew`'s form/deferred-photo-upload wiring.
 *
 * @returns {React.ReactElement} Game item creation page element.
 */
export default function GameItemNew() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [gameItemId, setGameItemId] = useState(null);
  const { state: fields, handleChange, handleCheckboxChange } = useFormState({
    name: '', description: '', hidden: false,
  });

  const currentHash = getCurrentHash();
  const gameSlug = BasePageController.extractParam(
    '/games/:game_slug/items/new', 'game_slug', currentHash,
  );

  const controller = useMemo(() => new GameItemNewController(Noop.noop, setFieldErrors), []);

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
      setStatus, setFieldErrors, setGameItemId,
    },
  );

  const handleRetryPhotoUpload = () => controller.retryPhotoUpload(
    gameSlug,
    gameItemId,
    photoFile,
    { setStatus, setGameItemId },
  );

  const handleSkipPhotoUpload = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = `/games/${gameSlug}/items`;
    }
  };

  return (
    <>
      {GameItemNewHelper.render(
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

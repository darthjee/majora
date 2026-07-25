import { useEffect, useMemo, useState } from 'react';
import GameDocumentNewController from './controllers/GameDocumentNewController.js';
import GameDocumentNewHelper from './helpers/GameDocumentNewHelper.jsx';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import BasePageController from '../../../common/base/controllers/BasePageController.js';
import Noop from '../../../../utils/Noop.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';
import useFormState from '../../../../utils/useFormState.js';

/**
 * Game-level document creation page (issue #758, deferred photo upload added in #727): creates a
 * bare `GameDocument` with no owning `CharacterDocument`, gated to dm/admin/staff via
 * `can_create_document`. Mirrors `GameItemNew`'s form/deferred-photo-upload wiring.
 *
 * @returns {React.ReactElement} Game document creation page element.
 */
export default function GameDocumentNew() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [gameDocumentId, setGameDocumentId] = useState(null);
  const { state: fields, handleChange, handleCheckboxChange } = useFormState({
    name: '', description: '', hidden: false,
  });

  const currentHash = getCurrentHash();
  const gameSlug = BasePageController.extractParam(
    '/games/:game_slug/documents/new', 'game_slug', currentHash,
  );

  const controller = useMemo(() => new GameDocumentNewController(Noop.noop, setFieldErrors), []);

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
      setStatus, setFieldErrors, setGameDocumentId,
    },
  );

  const handleRetryPhotoUpload = () => controller.retryPhotoUpload(
    gameSlug,
    gameDocumentId,
    photoFile,
    { setStatus, setGameDocumentId },
  );

  const handleSkipPhotoUpload = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = `/games/${gameSlug}/documents`;
    }
  };

  return (
    <>
      {GameDocumentNewHelper.render(
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

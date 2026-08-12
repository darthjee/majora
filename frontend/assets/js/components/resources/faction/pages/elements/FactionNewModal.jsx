import { useEffect, useMemo, useState } from 'react';
import FactionNewController from '../controllers/FactionNewController.js';
import FactionNewModalHelper from './helpers/FactionNewModalHelper.jsx';
import PhotoUploadModal from '../../../../common/modals/PhotoUploadModal.jsx';
import Noop from '../../../../../utils/Noop.js';

/**
 * Single-column "New Faction" modal, launched from the factions list page (`GameFactions.jsx`,
 * issue #812). Owns the same create/photo-upload-saga form state pattern `SourceNewModal.jsx`
 * uses, but every terminal success (record created with no photo, or its photo successfully
 * uploaded) calls `onSuccess` instead of redirecting to the new record's show page — the caller
 * decides what "success" means (closing the modal and reloading the list). Form state resets
 * whenever the modal is closed, via {@link #resetForm}, so the next time it's opened it starts
 * from a blank form regardless of how it was previously left.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {string} props.gameSlug - Game slug the faction is being created under.
 * @param {Function} props.onClose - Handler invoked when the modal is dismissed without success
 *   (backdrop click, close button, or the Escape key).
 * @param {Function} props.onSuccess - Handler invoked once the faction (and its photo, if one
 *   was picked) has been successfully created.
 * @returns {React.ReactElement} Rendered "New Faction" modal.
 */
export default function FactionNewModal({ show, gameSlug, onClose, onSuccess }) {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [name, setName] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [createdId, setCreatedId] = useState(null);

  const controller = useMemo(
    () => new FactionNewController(Noop.noop, setFieldErrors),
    [],
  );

  const photoPreviewUrl = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : null),
    [photoFile],
  );

  useEffect(() => () => {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
  }, [photoPreviewUrl]);

  const resetForm = () => {
    setFieldErrors({});
    setStatus('idle');
    setName('');
    setPhotoFile(null);
    setCreatedId(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSuccess = () => {
    resetForm();
    onSuccess();
  };

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    { name, photoFile },
    {
      setStatus, setFieldErrors, setCreatedId, onSuccess: handleSuccess,
    },
  );

  const handleRetryPhotoUpload = () => controller.retryPhotoUpload(
    gameSlug,
    createdId,
    photoFile,
    { setStatus, setCreatedId, onSuccess: handleSuccess },
  );

  return (
    <>
      {FactionNewModalHelper.render(
        show,
        {
          name, status, fieldErrors, photoPreviewUrl,
        },
        {
          onClose: handleClose,
          onSubmit: handleSubmit,
          onNameChange: (event) => setName(event.target.value),
          onOpenUploadModal: () => setShowUploadModal(true),
          onRetryPhotoUpload: handleRetryPhotoUpload,
          onSkipPhotoUpload: handleSuccess,
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

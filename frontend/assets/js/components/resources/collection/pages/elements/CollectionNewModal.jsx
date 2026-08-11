import { useEffect, useMemo, useState } from 'react';
import CollectionNewController from '../controllers/CollectionNewController.js';
import CollectionNewModalHelper from './helpers/CollectionNewModalHelper.jsx';
import PhotoUploadModal from '../../../../common/modals/PhotoUploadModal.jsx';
import Noop from '../../../../../utils/Noop.js';

/**
 * Single-column "New Collection" modal, launched from the collections list page
 * (`Collections.jsx`). Owns the same create/photo-upload-saga form state pattern
 * `SourceNewModal.jsx` uses, but every terminal success (record created with no photo, or its
 * photo successfully uploaded) calls `onSuccess` instead of redirecting to the new record's show
 * page — the caller decides what "success" means (closing the modal and reloading the list).
 * Form state resets whenever the modal is closed, via {@link #resetForm}, so the next time it's
 * opened it starts from a blank form regardless of how it was previously left.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {Function} props.onClose - Handler invoked when the modal is dismissed without success
 *   (backdrop click, close button, or the Escape key).
 * @param {Function} props.onSuccess - Handler invoked once the collection (and its photo, if one
 *   was picked) has been successfully created.
 * @returns {React.ReactElement} Rendered "New Collection" modal.
 */
export default function CollectionNewModal({ show, onClose, onSuccess }) {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [source, setSource] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [createdId, setCreatedId] = useState(null);

  const controller = useMemo(
    () => new CollectionNewController(Noop.noop, setFieldErrors),
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
    setUrl('');
    setSource(null);
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
    {
      name, url, source, photoFile,
    },
    {
      setStatus, setFieldErrors, setCreatedId, onSuccess: handleSuccess,
    },
  );

  const handleRetryPhotoUpload = () => controller.retryPhotoUpload(
    createdId,
    photoFile,
    { setStatus, setCreatedId, onSuccess: handleSuccess },
  );

  return (
    <>
      {CollectionNewModalHelper.render(
        show,
        {
          name, url, source, status, fieldErrors, photoPreviewUrl,
        },
        {
          onClose: handleClose,
          onSubmit: handleSubmit,
          onNameChange: (event) => setName(event.target.value),
          onUrlChange: (event) => setUrl(event.target.value),
          onSourceChange: setSource,
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

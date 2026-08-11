import { useEffect, useMemo, useState } from 'react';
import StlModelNewController from '../controllers/StlModelNewController.js';
import StlModelNewModalHelper from './helpers/StlModelNewModalHelper.jsx';
import PhotoUploadModal from '../../../../common/modals/PhotoUploadModal.jsx';
import Noop from '../../../../../utils/Noop.js';

/**
 * Split, trim, and de-duplicate (case-insensitively, against both the pending tags list and the
 * other newly split pieces) a raw comma-separated tag input value, appending the resulting
 * pieces to the current pending tags list. Blank pieces (e.g. a trailing comma) are dropped.
 *
 * @param {string[]} tags - Current pending tags list.
 * @param {string} tagInput - Raw comma-separated input value.
 * @returns {string[]} The pending tags list with new, deduplicated pieces appended.
 */
export function buildTagsAfterAdd(tags, tagInput) {
  const seen = new Set(tags.map((tag) => tag.toLowerCase()));
  const additions = tagInput
    .split(',')
    .map((piece) => piece.trim())
    .filter((piece) => piece.length > 0)
    .filter((piece) => {
      const lower = piece.toLowerCase();

      if (seen.has(lower)) {
        return false;
      }

      seen.add(lower);
      return true;
    });

  return [...tags, ...additions];
}

/**
 * Two-column "New STL model" modal, launched from the STL models list page (`StlModels.jsx`)
 * instead of a standalone `/stl_models/new` route. Owns the same create/photo-upload-saga form
 * state `StlModelNew.jsx` used to own, but every terminal success (record created with no photo,
 * or its photo successfully uploaded) calls `onSuccess` instead of redirecting to the new
 * record's show page — the caller decides what "success" means (closing the modal and reloading
 * the list). Form state resets whenever the modal is closed, via {@link #resetForm}, so the next
 * time it's opened it starts from a blank form regardless of how it was previously left.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {Function} props.onClose - Handler invoked when the modal is dismissed without success
 *   (backdrop click, close button, or the Escape key).
 * @param {Function} props.onSuccess - Handler invoked once the STL model (and its photo, if one
 *   was picked) has been successfully created.
 * @returns {React.ReactElement} Rendered "New STL model" modal.
 */
export default function StlModelNewModal({ show, onClose, onSuccess }) {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [name, setName] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [sources, setSources] = useState([]);
  const [collections, setCollections] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [createdId, setCreatedId] = useState(null);

  const controller = useMemo(
    () => new StlModelNewController(Noop.noop, setFieldErrors),
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
    setTags([]);
    setTagInput('');
    setSources([]);
    setCollections([]);
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
      name, tags, sources, collections, photoFile,
    },
    {
      setStatus, setFieldErrors, setCreatedId, onSuccess: handleSuccess,
    },
  );

  const handleAddTag = () => {
    setTags((prev) => buildTagsAfterAdd(prev, tagInput));
    setTagInput('');
  };

  const handleRemoveTag = (tag) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleRetryPhotoUpload = () => controller.retryPhotoUpload(
    createdId,
    photoFile,
    { setStatus, setCreatedId, onSuccess: handleSuccess },
  );

  return (
    <>
      {StlModelNewModalHelper.render(
        show,
        {
          name, tags, tagInput, sources, collections, status, fieldErrors, photoPreviewUrl,
        },
        {
          onClose: handleClose,
          onSubmit: handleSubmit,
          onNameChange: (event) => setName(event.target.value),
          onTagInputChange: (event) => setTagInput(event.target.value),
          onAddTag: handleAddTag,
          onRemoveTag: handleRemoveTag,
          onSourcesChange: setSources,
          onCollectionsChange: setCollections,
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

import { useEffect, useMemo, useState } from 'react';
import StlModelNewController from './controllers/StlModelNewController.js';
import StlModelNewHelper from './helpers/StlModelNewHelper.jsx';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import Noop from '../../../../utils/Noop.js';

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
 * STL model creation page.
 *
 * @returns {React.ReactElement} STL model creation page element.
 */
export default function StlModelNew() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [name, setName] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [createdId, setCreatedId] = useState(null);

  const controller = useMemo(
    () => new StlModelNewController(Noop.noop, setFieldErrors),
    [],
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
    { name, tags, photoFile },
    { setStatus, setFieldErrors, setCreatedId },
  );

  const handleAddTag = () => {
    setTags((prev) => buildTagsAfterAdd(prev, tagInput));
    setTagInput('');
  };

  const handleRetryPhotoUpload = () => controller.retryPhotoUpload(
    createdId,
    photoFile,
    { setStatus, setCreatedId },
  );

  const handleSkipPhotoUpload = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = `/stl_models/${createdId}`;
    }
  };

  return (
    <>
      {StlModelNewHelper.render(
        {
          name, tags, tagInput, status, fieldErrors, photoPreviewUrl,
        },
        {
          onSubmit: handleSubmit,
          onNameChange: (event) => setName(event.target.value),
          onTagInputChange: (event) => setTagInput(event.target.value),
          onAddTag: handleAddTag,
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

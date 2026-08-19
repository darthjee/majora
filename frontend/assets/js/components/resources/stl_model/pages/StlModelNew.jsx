import { useEffect, useMemo, useState } from 'react';
import StlModelNewController from './controllers/StlModelNewController.js';
import StlModelNewHelper from './helpers/StlModelNewHelper.jsx';
import StlModelNewModals from './elements/StlModelNewModals.jsx';
import Noop from '../../../../utils/Noop.js';
import useFormState from '../../../../utils/useFormState.js';
import { TYPE_VALUES } from '../stlModelEnums.js';

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
 * "New STL model" page, restoring the pre-modal (`StlModelNewModal.jsx`) full-page creation flow
 * at `/#/miniatures/stl_models/new` (issue #1069). Owns the same create/photo-upload-saga form
 * state the modal used, plus the `owned`/`type`/`races`/`roles`/`url`/`size` fields.
 *
 * @returns {React.ReactElement} Rendered "New STL model" page.
 */
export default function StlModelNew() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [tagInput, setTagInput] = useState('');
  const [sources, setSources] = useState([]);
  const [collections, setCollections] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [createdId, setCreatedId] = useState(null);
  const {
    state: fields, setField, handleChange, handleCheckboxChange,
  } = useFormState({
    name: '', tags: [], owned: true, type: TYPE_VALUES[0], races: [], roles: [], url: '', size: '',
  });

  const controller = useMemo(
    () => new StlModelNewController(Noop.noop, setFieldErrors),
    [],
  );

  const photoPreviewUrl = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : null),
    [photoFile],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => () => {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
  }, [photoPreviewUrl]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    { ...fields, sources, collections, photoFile },
    { setStatus, setFieldErrors, setCreatedId },
  );

  const handleAddTag = () => {
    setField('tags', buildTagsAfterAdd(fields.tags, tagInput));
    setTagInput('');
  };

  const handleRemoveTag = (tag) => setField('tags', fields.tags.filter((t) => t !== tag));

  const handleRetryPhotoUpload = () => controller.retryPhotoUpload(
    createdId,
    photoFile,
    { setStatus, setCreatedId },
  );

  const handleSkipPhotoUpload = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = `/miniatures/stl_models/${createdId}`;
    }
  };

  return (
    <>
      {StlModelNewHelper.render(
        {
          ...fields, tagInput, sources, collections, status, fieldErrors, photoPreviewUrl,
        },
        {
          onSubmit: handleSubmit,
          onNameChange: handleChange('name'),
          onOwnedChange: handleCheckboxChange('owned'),
          onTypeChange: handleChange('type'),
          onRacesChange: (races) => setField('races', races),
          onRolesChange: (roles) => setField('roles', roles),
          onUrlChange: handleChange('url'),
          onSizeChange: handleChange('size'),
          onTagInputChange: (event) => setTagInput(event.target.value),
          onAddTag: handleAddTag,
          onRemoveTag: handleRemoveTag,
          onSourcesChange: setSources,
          onCollectionsChange: setCollections,
          onOpenUploadModal: () => setShowUploadModal(true),
          onRetryPhotoUpload: handleRetryPhotoUpload,
          onSkipPhotoUpload: handleSkipPhotoUpload,
        },
      )}
      <StlModelNewModals
        showUploadModal={showUploadModal}
        setPhotoFile={setPhotoFile}
        onClose={() => setShowUploadModal(false)}
      />
    </>
  );
}

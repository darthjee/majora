import { useEffect, useMemo, useState } from 'react';
import StlModelNewController from './controllers/StlModelNewController.js';
import StlModelNewHelper from './helpers/StlModelNewHelper.jsx';
import StlModelNewModals from './elements/StlModelNewModals.jsx';
import Noop from '../../../../utils/Noop.js';
import useFormState from '../../../../utils/useFormState.js';
import usePhotoPreviewUrl from '../../../../utils/usePhotoPreviewUrl.js';
import useTagsField from './hooks/useTagsField.js';
import useStlModelNewHandlers from './hooks/useStlModelNewHandlers.js';
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
 * Initial values of the "New STL model" form fields.
 */
const INITIAL_FIELDS = {
  name: '', tags: [], owned: true, type: TYPE_VALUES[0], races: [], roles: [], url: '', size: '',
};

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
  const [sources, setSources] = useState([]);
  const [collections, setCollections] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const {
    state: fields, setField, handleChange, handleCheckboxChange,
  } = useFormState(INITIAL_FIELDS);

  const controller = useMemo(
    () => new StlModelNewController(Noop.noop, setFieldErrors),
    [],
  );

  const photoPreviewUrl = usePhotoPreviewUrl(photoFile);

  const {
    tagInput, onTagInputChange, handleAddTag, handleRemoveTag,
  } = useTagsField(fields.tags, setField);

  useEffect(() => controller.buildEffect()(), [controller]);

  const { handlers, modalProps } = useStlModelNewHandlers({
    controller,
    formData: { ...fields, sources, collections, photoFile },
    photoFile,
    setStatus,
    setFieldErrors,
  });

  return (
    <>
      {StlModelNewHelper.render(
        {
          ...fields, tagInput, sources, collections, status, fieldErrors, photoPreviewUrl,
        },
        {
          ...handlers,
          ...StlModelNewHelper.buildFieldHandlers({
            setField, handleChange, handleCheckboxChange, setSources, setCollections,
          }),
          onTagInputChange,
          onAddTag: handleAddTag,
          onRemoveTag: handleRemoveTag,
        },
      )}
      <StlModelNewModals {...modalProps} setPhotoFile={setPhotoFile} />
    </>
  );
}

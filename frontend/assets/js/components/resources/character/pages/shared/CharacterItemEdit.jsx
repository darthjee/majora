import { useEffect, useMemo, useState } from 'react';
import ItemEditHelper from '../../../item/pages/helpers/ItemEditHelper.jsx';
import PhotoUploadModal from '../../../../common/modals/PhotoUploadModal.jsx';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';
import useFormState from '../../../../../utils/useFormState.js';

/**
 * Shared PC/NPC item edit page component (issue #766): loads a `CharacterItem` via the given
 * controller class (the elevated `.../items/:id/full.json` endpoint), lets the user edit
 * `name`/`description`/`hidden` through {@link ItemEditHelper} — the same helper `GameItemEdit`
 * uses, since the layout is identical for game/PC/NPC items — and PATCHes `.../items/:id.json` on
 * submit. Also wires up the photo upload modal for the (unrelated) upload action button,
 * mirroring `CharacterItem`'s upload modal wiring.
 *
 * @param {object} props - Component props.
 * @param {string} props.characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @param {Function} props.ControllerClass - Item edit controller class to instantiate.
 * @param {Function} props.getParamsFromHash - Hash-parsing function for this character type.
 * @returns {React.ReactElement} Character item edit page element.
 */
export default function CharacterItemEdit({ characterKind, ControllerClass, getParamsFromHash }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { state: fields, setField, handleChange, handleCheckboxChange } = useFormState({
    name: '',
    description: '',
    hidden: false,
  });

  const controller = useMemo(
    () => new ControllerClass(setItem, setLoading, setError, setFieldErrors),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, character_id: characterId, id: itemId } = getParamsFromHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    controller.applyLoadedItem(item, {
      setName: (value) => setField('name', value),
      setDescription: (value) => setField('description', value),
      setHidden: (value) => setField('hidden', value),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const handleSubmit = (event) => controller.submitForm(
    event, gameSlug, characterId, itemId, fields, { setStatus, setFieldErrors },
  );

  if (loading) return ItemEditHelper.renderLoading();
  if (error) return ItemEditHelper.renderError(error);

  const uploadPath = `/games/${gameSlug}/${characterKind}/${characterId}/items/${itemId}/photo_upload.json`;

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    controller.buildEffect()();
  };

  return (
    <>
      {ItemEditHelper.render(
        { ...fields, photo_path: item.photo_path, status, fieldErrors },
        {
          onSubmit: handleSubmit,
          onNameChange: handleChange('name'),
          onDescriptionChange: handleChange('description'),
          onHiddenChange: handleCheckboxChange('hidden'),
          onOpenUploadModal: () => setShowUploadModal(true),
        }
      )}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={uploadPath}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}

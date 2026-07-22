import { useEffect, useMemo, useState } from 'react';
import ItemEditHelper from './helpers/ItemEditHelper.jsx';
import GameItemEditController from './controllers/GameItemEditController.js';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import getCurrentHash from '../../../../utils/routing/currentHash.js';
import useFormState from '../../../../utils/useFormState.js';

/**
 * Game item edit page (issue #766): loads a `GameItem` via {@link GameItemEditController} (the
 * DM/admin-only `.../items/:id/full.json` endpoint), lets the user edit `name`/`description`/
 * `hidden` through {@link ItemEditHelper}, and PATCHes `.../items/:id.json` on submit. Also wires
 * up the photo upload modal for the (unrelated) upload action button, mirroring `GameItem`'s
 * upload modal wiring — photo stays on its own dedicated endpoint, unaffected by this form.
 *
 * @param {object} [props] - Component props.
 * @param {Function} [props.ControllerClass] - Item edit controller class to instantiate, mainly
 *   for tests.
 * @returns {React.ReactElement} Game item edit page element.
 */
export default function GameItemEdit({ ControllerClass = GameItemEditController }) {
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
  const { game_slug: gameSlug, id: itemId } = GameItemEditController.getParamsFromHash(currentHash);

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
    event, gameSlug, itemId, fields, { setStatus, setFieldErrors },
  );

  if (loading) return ItemEditHelper.renderLoading();
  if (error) return ItemEditHelper.renderError(error);

  const uploadPath = `/games/${gameSlug}/items/${itemId}/photo_upload.json`;

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

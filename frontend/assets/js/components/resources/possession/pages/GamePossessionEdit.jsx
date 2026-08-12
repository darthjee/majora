import { useEffect, useMemo, useState } from 'react';
import PossessionEditHelper from './helpers/PossessionEditHelper.jsx';
import GamePossessionEditController from './controllers/GamePossessionEditController.js';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import getCurrentHash from '../../../../utils/routing/currentHash.js';
import useFormState from '../../../../utils/useFormState.js';

/**
 * Game possession edit page (issue #1074): loads a `GamePossession` via
 * {@link GamePossessionEditController} (the DM/admin-only `.../possessions/:id/full.json`
 * endpoint), lets the user edit `name`/`description`/`hidden` through
 * {@link PossessionEditHelper}, and PATCHes `.../possessions/:id.json` on submit. Also wires up
 * the photo upload modal for the (unrelated) upload action button, mirroring `GamePossession`'s
 * upload modal wiring — photo stays on its own dedicated endpoint, unaffected by this form.
 *
 * @param {object} [props] - Component props.
 * @param {Function} [props.ControllerClass] - Possession edit controller class to instantiate,
 *   mainly for tests.
 * @returns {React.ReactElement} Game possession edit page element.
 */
export default function GamePossessionEdit({ ControllerClass = GamePossessionEditController }) {
  const [possession, setPossession] = useState(null);
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
    () => new ControllerClass(setPossession, setLoading, setError, setFieldErrors),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, id: possessionId } = GamePossessionEditController.getParamsFromHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    controller.applyLoadedItem(possession, {
      setName: (value) => setField('name', value),
      setDescription: (value) => setField('description', value),
      setHidden: (value) => setField('hidden', value),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [possession]);

  const handleSubmit = (event) => controller.submitForm(
    event, gameSlug, possessionId, fields, { setStatus, setFieldErrors },
  );

  if (loading) return PossessionEditHelper.renderLoading();
  if (error) return PossessionEditHelper.renderError(error);

  const uploadPath = `/games/${gameSlug}/possessions/${possessionId}/photo_upload.json`;

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    controller.buildEffect()();
  };

  return (
    <>
      {PossessionEditHelper.render(
        { ...fields, photo_path: possession.photo_path, status, fieldErrors },
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

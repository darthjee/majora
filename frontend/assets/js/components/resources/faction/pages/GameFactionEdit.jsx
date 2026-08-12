import { useEffect, useMemo, useState } from 'react';
import FactionEditHelper from './helpers/FactionEditHelper.jsx';
import GameFactionEditController from './controllers/GameFactionEditController.js';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import getCurrentHash from '../../../../utils/routing/currentHash.js';
import useFormState from '../../../../utils/useFormState.js';

/**
 * Game faction edit page (issue #812): loads a `Faction` via
 * {@link GameFactionEditController} (the DM/staff-only edit route), lets the user edit `name`
 * through {@link FactionEditHelper}, and PATCHes `.../factions/:id.json` on submit. Also wires
 * up the photo upload modal for the (unrelated) upload action button, mirroring
 * `GamePossessionEdit`'s upload modal wiring — photo stays on its own dedicated endpoint,
 * unaffected by this form.
 *
 * @param {object} [props] - Component props.
 * @param {Function} [props.ControllerClass] - Faction edit controller class to instantiate,
 *   mainly for tests.
 * @returns {React.ReactElement} Game faction edit page element.
 */
export default function GameFactionEdit({ ControllerClass = GameFactionEditController }) {
  const [faction, setFaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { state: fields, setField, handleChange } = useFormState({ name: '' });

  const controller = useMemo(
    () => new ControllerClass(setFaction, setLoading, setError, setFieldErrors),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, id: factionId } = GameFactionEditController.getParamsFromHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    controller.applyLoadedItem(faction, {
      setName: (value) => setField('name', value),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faction]);

  const handleSubmit = (event) => controller.submitForm(
    event, gameSlug, factionId, fields, { setStatus, setFieldErrors },
  );

  if (loading) return FactionEditHelper.renderLoading();
  if (error) return FactionEditHelper.renderError(error);

  const uploadPath = `/games/${gameSlug}/factions/${factionId}/photo_upload.json`;

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    controller.buildEffect()();
  };

  return (
    <>
      {FactionEditHelper.render(
        { ...fields, photo_path: faction.photo_path, status, fieldErrors },
        {
          onSubmit: handleSubmit,
          onNameChange: handleChange('name'),
          onOpenUploadModal: () => setShowUploadModal(true),
        },
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

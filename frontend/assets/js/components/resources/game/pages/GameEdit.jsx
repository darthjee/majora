import { useEffect, useMemo, useState } from 'react';
import GameEditController from './controllers/GameEditController.js';
import GameEditHelper from './helpers/GameEditHelper.jsx';
import GameHelper from './helpers/GameHelper.jsx';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import getCurrentHash from '../../../../utils/routing/currentHash.js';
import useFormState from '../../../../utils/useFormState.js';

/**
 * Game edit page.
 *
 * @returns {React.ReactElement} Game edit page element.
 */
export default function GameEdit() {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { state: fields, setField, handleChange } = useFormState({ name: '', description: '' });

  const controller = useMemo(
    () => new GameEditController(setGame, setLoading, setError, setFieldErrors),
    [],
  );

  const currentHash = getCurrentHash();
  const gameSlug = GameEditController.getGameSlugFromEditHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    if (!game) return;

    if (!game.can_edit) {
      if (typeof window !== 'undefined') {
        window.location.hash = `/games/${gameSlug}`;
      }
      return;
    }

    setField('name', game.name ?? '');
    setField('description', game.description ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    controller.buildEffect()();
  };

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    fields,
    { setStatus, setFieldErrors },
  );

  if (loading) return GameEditHelper.renderLoading();
  if (error) return GameHelper.renderError(error);

  return (
    <>
      {GameEditHelper.render(
        { ...fields, cover_photo_path: game?.cover_photo_path, status, fieldErrors },
        {
          onSubmit: handleSubmit,
          onNameChange: handleChange('name'),
          onDescriptionChange: handleChange('description'),
          onOpenUploadModal: () => setShowUploadModal(true),
        },
      )}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={`/games/${gameSlug}/photo_upload.json`}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}

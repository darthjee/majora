import { useEffect, useMemo, useState } from 'react';
import GameEditController, { getGameSlugFromEditHash } from './controllers/GameEditController.js';
import GameEditHelper from './helpers/GameEditHelper.jsx';
import GameHelper from './helpers/GameHelper.jsx';
import PhotoUploadModal from '../elements/PhotoUploadModal.jsx';

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
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const controller = useMemo(
    () => new GameEditController(setGame, setLoading, setError, setFieldErrors),
    [],
  );

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const gameSlug = getGameSlugFromEditHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    if (!game) return;

    if (!game.can_edit) {
      if (typeof window !== 'undefined') {
        window.location.hash = `/games/${gameSlug}`;
      }
      return;
    }

    setName(game.name ?? '');
    setDescription(game.description ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    { name, description },
    { setStatus, setFieldErrors },
  );

  if (loading) return GameEditHelper.renderLoading();
  if (error) return GameHelper.renderError(error);

  return (
    <>
      {GameEditHelper.render(
        { name, description, status, fieldErrors },
        {
          onSubmit: handleSubmit,
          onNameChange: (event) => setName(event.target.value),
          onDescriptionChange: (event) => setDescription(event.target.value),
          onOpenUploadModal: () => setShowUploadModal(true),
        },
      )}
      <PhotoUploadModal
        show={showUploadModal}
        uploadPath={`/games/${gameSlug}/photo_upload.json`}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => setShowUploadModal(false)}
      />
    </>
  );
}

import { useEffect, useMemo, useState } from 'react';
import GameEditController, { getGameSlugFromEditHash } from './controllers/GameEditController.js';
import GameEditHelper from './helpers/GameEditHelper.jsx';
import GameHelper from './helpers/GameHelper.jsx';

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
  const [photo, setPhoto] = useState('');
  const [description, setDescription] = useState('');

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
    setPhoto(game.photo ?? '');
    setDescription(game.description ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    { name, photo, description },
    { setStatus, setFieldErrors },
  );

  if (loading) return GameEditHelper.renderLoading();
  if (error) return GameHelper.renderError(error);

  return GameEditHelper.render(
    { name, photo, description, status, fieldErrors },
    {
      onSubmit: handleSubmit,
      onNameChange: (event) => setName(event.target.value),
      onPhotoChange: (event) => setPhoto(event.target.value),
      onDescriptionChange: (event) => setDescription(event.target.value),
    },
  );
}

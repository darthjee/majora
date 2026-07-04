import { useEffect, useMemo, useState } from 'react';
import GameSessionEditController, { getSessionParamsFromEditHash }
  from './controllers/GameSessionEditController.js';
import GameSessionEditHelper from './helpers/GameSessionEditHelper.jsx';
import GameSessionHelper from './helpers/GameSessionHelper.jsx';

/**
 * Game session edit page.
 *
 * @returns {React.ReactElement} Game session edit page element.
 */
export default function GameSessionEdit() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  const controller = useMemo(
    () => new GameSessionEditController(setSession, setLoading, setError, setFieldErrors),
    [],
  );

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const { game_slug: gameSlug, id } = getSessionParamsFromEditHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    if (!session) return;

    if (!session.can_edit) {
      if (typeof window !== 'undefined') {
        window.location.hash = `/games/${gameSlug}/sessions/${id}`;
      }
      return;
    }

    setTitle(session.title ?? '');
    setDate(session.date ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    id,
    { title, date },
    { setStatus, setFieldErrors },
  );

  if (loading) return GameSessionEditHelper.renderLoading();
  if (error) return GameSessionHelper.renderError(error);

  return GameSessionEditHelper.render(
    { title, date, status, fieldErrors },
    {
      onSubmit: handleSubmit,
      onTitleChange: (event) => setTitle(event.target.value),
      onDateChange: (event) => setDate(event.target.value),
    },
  );
}

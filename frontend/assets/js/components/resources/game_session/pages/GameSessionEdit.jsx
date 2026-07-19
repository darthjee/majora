import { useEffect, useMemo, useState } from 'react';
import GameSessionEditController from './controllers/GameSessionEditController.js';
import GameSessionEditHelper from './helpers/GameSessionEditHelper.jsx';
import GameSessionHelper from './helpers/GameSessionHelper.jsx';
import getCurrentHash from '../../../../utils/routing/currentHash.js';
import useFormState from '../../../../utils/useFormState.js';

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
  const { state: fields, setField, handleChange } = useFormState({ title: '', date: '', description: '' });

  const controller = useMemo(
    () => new GameSessionEditController(setSession, setLoading, setError, setFieldErrors),
    [],
  );

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, id } = GameSessionEditController.getSessionParamsFromEditHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    if (!session) return;

    if (!session.can_edit) {
      if (typeof window !== 'undefined') {
        window.location.hash = `/games/${gameSlug}/sessions/${id}`;
      }
      return;
    }

    setField('title', session.title ?? '');
    setField('date', session.date ?? '');
    setField('description', session.description ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    id,
    fields,
    { setStatus, setFieldErrors },
  );

  if (loading) return GameSessionEditHelper.renderLoading();
  if (error) return GameSessionHelper.renderError(error);

  return GameSessionEditHelper.render(
    { ...fields, status, fieldErrors },
    {
      onSubmit: handleSubmit,
      onTitleChange: handleChange('title'),
      onDateChange: handleChange('date'),
      onDescriptionChange: handleChange('description'),
    },
  );
}

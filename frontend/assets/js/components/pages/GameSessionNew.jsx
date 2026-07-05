import { useEffect, useMemo, useState } from 'react';
import GameSessionNewController, { getGameSlugFromSessionNewHash }
  from './controllers/GameSessionNewController.js';
import Noop from '../../utils/Noop.js';
import GameSessionNewHelper from './helpers/GameSessionNewHelper.jsx';

/**
 * Game session creation page.
 *
 * @returns {React.ReactElement} Game session creation page element.
 */
export default function GameSessionNew() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  const controller = useMemo(
    () => new GameSessionNewController(Noop.noop, setFieldErrors),
    [],
  );

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const gameSlug = getGameSlugFromSessionNewHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    { title, date },
    { setStatus, setFieldErrors },
  );

  return GameSessionNewHelper.render(
    { title, date, status, fieldErrors },
    {
      onSubmit: handleSubmit,
      onTitleChange: (event) => setTitle(event.target.value),
      onDateChange: (event) => setDate(event.target.value),
    },
  );
}

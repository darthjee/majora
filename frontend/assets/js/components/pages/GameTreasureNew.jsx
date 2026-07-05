import { useEffect, useMemo, useState } from 'react';
import GameTreasureNewController, { getGameSlugFromTreasureNewHash }
  from './controllers/GameTreasureNewController.js';
import GameTreasureNewHelper from './helpers/GameTreasureNewHelper.jsx';
import Noop from '../../utils/Noop.js';

/**
 * Game treasure creation page.
 *
 * @returns {React.ReactElement} Game treasure creation page element.
 */
export default function GameTreasureNew() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [name, setName] = useState('');
  const [value, setValue] = useState('');

  const controller = useMemo(
    () => new GameTreasureNewController(Noop.noop, setFieldErrors),
    [],
  );

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const gameSlug = getGameSlugFromTreasureNewHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    { name, value },
    { setStatus, setFieldErrors },
  );

  return GameTreasureNewHelper.render(
    { name, value, status, fieldErrors },
    {
      onSubmit: handleSubmit,
      onNameChange: (event) => setName(event.target.value),
      onValueChange: (event) => setValue(event.target.value),
    },
  );
}

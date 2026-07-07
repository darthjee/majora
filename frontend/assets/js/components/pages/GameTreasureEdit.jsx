import { useEffect, useMemo, useState } from 'react';
import GameTreasureEditController from './controllers/GameTreasureEditController.js';
import GameTreasureEditHelper from './helpers/GameTreasureEditHelper.jsx';

/**
 * Game treasure edit page.
 *
 * @returns {React.ReactElement} Game treasure edit page element.
 */
export default function GameTreasureEdit() {
  const [treasure, setTreasure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [maxUnits, setMaxUnits] = useState('');

  const controller = useMemo(
    () => new GameTreasureEditController(setTreasure, setLoading, setError, setFieldErrors),
    [],
  );

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const { game_slug: gameSlug, treasure_id: treasureId } =
    GameTreasureEditController.getGameTreasureEditParamsFromHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    if (!treasure) return;

    setName(treasure.name ?? '');
    setValue(treasure.value !== null ? String(treasure.value) : '');
    setMaxUnits(treasure.max_units !== null && treasure.max_units !== undefined ? String(treasure.max_units) : '');
  }, [treasure]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    treasureId,
    { name, value, maxUnits },
    { setStatus, setFieldErrors },
  );

  if (loading) return GameTreasureEditHelper.renderLoading();
  if (error) return GameTreasureEditHelper.renderError(error);

  return GameTreasureEditHelper.render(
    {
      name, value, maxUnits, status, fieldErrors,
    },
    {
      onSubmit: handleSubmit,
      onNameChange: (event) => setName(event.target.value),
      onValueChange: (event) => setValue(event.target.value),
      onMaxUnitsChange: (event) => setMaxUnits(event.target.value),
    },
  );
}

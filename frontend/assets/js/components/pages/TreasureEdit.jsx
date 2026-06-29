import { useEffect, useMemo, useState } from 'react';
import TreasureEditController, { getTreasureIdFromEditHash }
  from './controllers/TreasureEditController.js';
import TreasureEditHelper from './helpers/TreasureEditHelper.jsx';
import TreasureHelper from './helpers/TreasureHelper.jsx';

/**
 * Treasure edit page.
 *
 * @returns {React.ReactElement} Treasure edit page element.
 */
export default function TreasureEdit() {
  const [treasure, setTreasure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [name, setName] = useState('');
  const [value, setValue] = useState('');

  const controller = useMemo(
    () => new TreasureEditController(setTreasure, setLoading, setError, setFieldErrors),
    [],
  );

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const treasureId = getTreasureIdFromEditHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    if (!treasure) return;

    if (!treasure.can_edit) {
      if (typeof window !== 'undefined') {
        window.location.hash = `/treasures/${treasureId}`;
      }
      return;
    }

    setName(treasure.name ?? '');
    setValue(treasure.value !== null ? String(treasure.value) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treasure]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    treasureId,
    { name, value },
    { setStatus, setFieldErrors },
  );

  if (loading) return TreasureEditHelper.renderLoading();
  if (error) return TreasureHelper.renderError(error);

  return TreasureEditHelper.render(
    { name, value, status, fieldErrors },
    {
      onSubmit: handleSubmit,
      onNameChange: (event) => setName(event.target.value),
      onValueChange: (event) => setValue(event.target.value),
    },
  );
}

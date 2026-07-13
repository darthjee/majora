import { useEffect, useMemo, useState } from 'react';
import TreasureNewController from './controllers/TreasureNewController.js';
import TreasureNewHelper from './helpers/TreasureNewHelper.jsx';
import Noop from '../../../../utils/Noop.js';

/**
 * Treasure creation page.
 *
 * @returns {React.ReactElement} Treasure creation page element.
 */
export default function TreasureNew() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [name, setName] = useState('');
  const [value, setValue] = useState('');

  const controller = useMemo(
    () => new TreasureNewController(Noop.noop, setFieldErrors),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    { name, value },
    { setStatus, setFieldErrors },
  );

  return TreasureNewHelper.render(
    { name, value, status, fieldErrors },
    {
      onSubmit: handleSubmit,
      onNameChange: (event) => setName(event.target.value),
      onValueChange: (event) => setValue(event.target.value),
    },
  );
}

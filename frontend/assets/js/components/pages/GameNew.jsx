import { useEffect, useMemo, useState } from 'react';
import GameNewController from './controllers/GameNewController.js';
import GameNewHelper from './helpers/GameNewHelper.jsx';

/**
 * Game creation page.
 *
 * @returns {React.ReactElement} Game creation page element.
 */
export default function GameNew() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const controller = useMemo(
    () => new GameNewController(() => {}, setFieldErrors),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    { name, description },
    { setStatus, setFieldErrors },
  );

  return GameNewHelper.render(
    { name, description, status, fieldErrors },
    {
      onSubmit: handleSubmit,
      onNameChange: (event) => setName(event.target.value),
      onDescriptionChange: (event) => setDescription(event.target.value),
    },
  );
}

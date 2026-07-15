import { useEffect, useMemo, useState } from 'react';
import GameNewController from './controllers/GameNewController.js';
import GameNewHelper from './helpers/GameNewHelper.jsx';
import Noop from '../../../../utils/Noop.js';

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
  const [gameType, setGameType] = useState('dnd');

  const controller = useMemo(
    () => new GameNewController(Noop.noop, setFieldErrors),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    { name, description, game_type: gameType },
    { setStatus, setFieldErrors },
  );

  return GameNewHelper.render(
    { name, description, gameType, status, fieldErrors },
    {
      onSubmit: handleSubmit,
      onNameChange: (event) => setName(event.target.value),
      onDescriptionChange: (event) => setDescription(event.target.value),
      onGameTypeChange: (event) => setGameType(event.target.value),
    },
  );
}

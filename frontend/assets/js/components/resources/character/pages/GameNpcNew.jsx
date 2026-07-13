import { useEffect, useMemo, useState } from 'react';
import GameNpcNewController from './controllers/GameNpcNewController.js';
import Noop from '../../../../utils/Noop.js';
import GameNpcNewHelper from './helpers/GameNpcNewHelper.jsx';

/**
 * Game NPC creation page.
 *
 * @returns {React.ReactElement} Game NPC creation page element.
 */
export default function GameNpcNew() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [privateDescription, setPrivateDescription] = useState('');
  const [hidden, setHidden] = useState(false);
  const [money, setMoney] = useState('0');
  const [allegiance, setAllegiance] = useState('neutral');
  const [publicAllegiance, setPublicAllegiance] = useState('neutral');

  const controller = useMemo(
    () => new GameNpcNewController(Noop.noop, setFieldErrors),
    [],
  );

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const gameSlug = GameNpcNewController.getGameSlugFromNpcNewHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    { name, role, description, privateDescription, hidden, money, allegiance, publicAllegiance },
    { setStatus, setFieldErrors },
  );

  return GameNpcNewHelper.render(
    {
      name, role, description, privateDescription, hidden, money, allegiance, publicAllegiance,
      status, fieldErrors,
    },
    {
      onSubmit: handleSubmit,
      onNameChange: (event) => setName(event.target.value),
      onRoleChange: (event) => setRole(event.target.value),
      onDescriptionChange: (event) => setDescription(event.target.value),
      onPrivateDescriptionChange: (event) => setPrivateDescription(event.target.value),
      onHiddenChange: (event) => setHidden(event.target.checked),
      onMoneyChange: (event) => setMoney(event.target.value),
      onAllegianceChange: (event) => setAllegiance(event.target.value),
      onPublicAllegianceChange: (event) => setPublicAllegiance(event.target.value),
    },
  );
}

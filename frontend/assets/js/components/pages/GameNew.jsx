import { useEffect, useMemo, useState } from 'react';
import AuthStorage from '../../utils/AuthStorage.js';
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
  const [photo, setPhoto] = useState('');
  const [description, setDescription] = useState('');

  const controller = useMemo(
    () => new GameNewController(() => {}, setFieldErrors),
    [],
  );

  useEffect(() => {
    const token = AuthStorage.getToken();

    if (!token) {
      if (typeof window !== 'undefined') {
        window.location.hash = '/users/register';
      }
    }
  }, []);

  const handleSubmit = (event) => controller.submitForm(
    event,
    { name, photo, description },
    { setStatus, setFieldErrors },
  );

  return GameNewHelper.render(
    { name, photo, description, status, fieldErrors },
    {
      onSubmit: handleSubmit,
      onNameChange: (event) => setName(event.target.value),
      onPhotoChange: (event) => setPhoto(event.target.value),
      onDescriptionChange: (event) => setDescription(event.target.value),
    },
  );
}

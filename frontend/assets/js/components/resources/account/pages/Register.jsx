import { useMemo, useState } from 'react';
import RegisterController from './controllers/RegisterController.js';
import RegisterHelper from './helpers/RegisterHelper.jsx';

/**
 * Registration page. This is a logged-out flow that, on success, stores
 * the returned auth token and redirects to the home page.
 *
 * @returns {React.ReactElement} register page element.
 */
export default function Register() {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [status, setStatus] = useState('idle');

  const controller = useMemo(
    () => new RegisterController(setStatus),
    [],
  );

  const handleSubmit = (event) => {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    return controller.handleSubmit(name, displayName, email, password, passwordConfirmation);
  };

  return RegisterHelper.render(
    {
      name,
      displayName,
      email,
      password,
      passwordConfirmation,
      status,
    },
    {
      onSubmit: handleSubmit,
      onNameChange: (event) => setName(event.target.value),
      onDisplayNameChange: (event) => setDisplayName(event.target.value),
      onEmailChange: (event) => setEmail(event.target.value),
      onPasswordChange: (event) => setPassword(event.target.value),
      onPasswordConfirmationChange: (event) => setPasswordConfirmation(event.target.value),
    }
  );
}

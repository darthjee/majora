import { useEffect, useMemo, useState } from 'react';
import MyAccountController from './controllers/MyAccountController.js';
import MyAccountHelper from './helpers/MyAccountHelper.jsx';

/**
 * My account page, letting the logged-in user edit their own username,
 * email and, optionally, password.
 *
 * @returns {React.ReactElement} My account page element.
 */
export default function MyAccount() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');

  const controller = useMemo(
    () => new MyAccountController(setName, setEmail, setLoading),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    { name, email, password, passwordConfirmation },
    { setStatus, setFieldErrors },
  );

  if (loading) return MyAccountHelper.renderLoading();

  return MyAccountHelper.render(
    { name, email, password, passwordConfirmation, status, fieldErrors },
    {
      onSubmit: handleSubmit,
      onNameChange: (event) => setName(event.target.value),
      onEmailChange: (event) => setEmail(event.target.value),
      onPasswordChange: (event) => setPassword(event.target.value),
      onPasswordConfirmationChange: (event) => setPasswordConfirmation(event.target.value),
    },
  );
}

import { useEffect, useMemo, useState } from 'react';
import MyAccountController from './controllers/MyAccountController.js';
import MyAccountHelper from './helpers/MyAccountHelper.jsx';
import useFormState from '../../../../utils/useFormState.js';

/**
 * My account page, letting the logged-in user edit their own username,
 * email and, optionally, password.
 *
 * @returns {React.ReactElement} My account page element.
 */
export default function MyAccount() {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const { state: fields, setField, handleChange } = useFormState({
    name: '',
    displayName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  });

  const controller = useMemo(
    () => new MyAccountController(
      (value) => setField('name', value),
      (value) => setField('displayName', value),
      (value) => setField('firstName', value),
      (value) => setField('lastName', value),
      (value) => setField('email', value),
      setAvatarUrl,
      setLoading,
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    fields,
    { setStatus, setFieldErrors },
  );

  if (loading) return MyAccountHelper.renderLoading();

  return MyAccountHelper.render(
    { ...fields, avatarUrl, status, fieldErrors },
    {
      onSubmit: handleSubmit,
      onNameChange: handleChange('name'),
      onDisplayNameChange: handleChange('displayName'),
      onFirstNameChange: handleChange('firstName'),
      onLastNameChange: handleChange('lastName'),
      onEmailChange: handleChange('email'),
      onPasswordChange: handleChange('password'),
      onPasswordConfirmationChange: handleChange('passwordConfirmation'),
    },
  );
}

import { useMemo, useState } from 'react';
import RegisterController from './controllers/RegisterController.js';
import RegisterHelper from './helpers/RegisterHelper.jsx';
import useFormState from '../../../../utils/useFormState.js';

/**
 * Registration page. This is a logged-out flow that, on success, stores
 * the returned auth token and redirects to the home page.
 *
 * @returns {React.ReactElement} register page element.
 */
export default function Register() {
  const [status, setStatus] = useState('idle');
  const { state: fields, handleChange } = useFormState({
    name: '',
    displayName: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  });

  const controller = useMemo(
    () => new RegisterController(setStatus),
    [],
  );

  const handleSubmit = (event) => {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    return controller.handleSubmit(
      fields.name, fields.displayName, fields.email, fields.password, fields.passwordConfirmation,
    );
  };

  return RegisterHelper.render(
    { ...fields, status },
    {
      onSubmit: handleSubmit,
      onNameChange: handleChange('name'),
      onDisplayNameChange: handleChange('displayName'),
      onEmailChange: handleChange('email'),
      onPasswordChange: handleChange('password'),
      onPasswordConfirmationChange: handleChange('passwordConfirmation'),
    }
  );
}

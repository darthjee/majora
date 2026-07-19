import { useEffect, useMemo, useState } from 'react';
import RecoverPasswordController from './controllers/RecoverPasswordController.js';
import RecoverPasswordHelper from './helpers/RecoverPasswordHelper.jsx';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Recover-password page, driven entirely by the `token` query param in
 * the URL hash. This is a logged-out flow and does not use the stored
 * auth token.
 *
 * @returns {React.ReactElement} recover-password page element.
 */
export default function RecoverPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [ready, setReady] = useState(false);

  const controller = useMemo(
    () => new RecoverPasswordController(setStatus, setErrorMessage),
    [],
  );

  useEffect(() => {
    const cancelToken = { cancelled: false };

    controller.waitUntilReady(setReady, undefined, cancelToken);

    return () => {
      cancelToken.cancelled = true;
    };
  }, [controller]);

  const currentHash = getCurrentHash();
  const token = RecoverPasswordController.getRecoverPasswordTokenFromHash(currentHash);

  const handleSubmit = (event) => {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    return controller.handleSubmit(token, password, confirmPassword);
  };

  return RecoverPasswordHelper.render(
    {
      password,
      confirmPassword,
      status,
      errorMessage,
      ready,
    },
    {
      onSubmit: handleSubmit,
      onPasswordChange: (event) => setPassword(event.target.value),
      onConfirmPasswordChange: (event) => setConfirmPassword(event.target.value),
    }
  );
}

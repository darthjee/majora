import { useState } from 'react';
import LoginModalController from './controllers/LoginModalController.js';
import LoginModalHelper from './helpers/LoginModalHelper.jsx';

/**
 * Stateful login modal component.
 *
 * @param {{show: boolean, onClose: Function, onSuccess: Function}} props - component props.
 * @returns {React.ReactElement} rendered login modal.
 */
export default function LoginModal({ show, onClose, onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [incorrect, setIncorrect] = useState(false);
  const [error, setError] = useState(false);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);

  const controller = new LoginModalController(
    setUsername,
    setPassword,
    setIncorrect,
    setError,
    onSuccess,
    undefined,
    setRecoverySent
  );

  const handleClear = () => {
    controller.handleClear();
    setMode('login');
    setEmail('');
  };

  const handleClose = () => {
    handleClear();

    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handleSubmit = (event) => {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    return controller.handleSubmit(username, password);
  };

  const handleRecoverSubmit = (event) => {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    return controller.handleRecoverSubmit(email);
  };

  return LoginModalHelper.render(
    show,
    {
      username,
      password,
      incorrect,
      error,
      mode,
      email,
      recoverySent,
    },
    {
      onClose: handleClose,
      onCancel: handleClose,
      onSubmit: handleSubmit,
      onUsernameChange: (event) => setUsername(event.target.value),
      onPasswordChange: (event) => setPassword(event.target.value),
      onForgotPasswordClick: () => setMode('recover'),
      onBackToLoginClick: () => setMode('login'),
      onEmailChange: (event) => setEmail(event.target.value),
      onRecoverSubmit: handleRecoverSubmit,
    }
  );
}

import { useMemo, useState } from 'react';
import LoginModalController from './controllers/LoginModalController.js';
import LoginModalHelper from './helpers/LoginModalHelper.jsx';
import AuthorizationRequestPoller from '../../../utils/polling/AuthorizationRequestPoller.js';

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
  const [authorizeStatus, setAuthorizeStatus] = useState(null);

  // Memoized so the same poller instance (and its running interval) survives
  // across re-renders, instead of being replaced every time this component
  // re-renders (as `controller` below intentionally is).
  const poller = useMemo(() => new AuthorizationRequestPoller(), []);

  const controller = new LoginModalController(
    setUsername,
    setPassword,
    setIncorrect,
    setError,
    onSuccess,
    undefined,
    setRecoverySent,
    setAuthorizeStatus,
    poller,
    setMode,
    setEmail
  );

  const handleClose = () => controller.handleClose(onClose);

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
      authorizeStatus,
    },
    {
      onClose: handleClose,
      onCancel: handleClose,
      onSubmit: (event) => controller.handleSubmitEvent(event, username, password),
      onUsernameChange: (event) => setUsername(event.target.value),
      onPasswordChange: (event) => setPassword(event.target.value),
      onForgotPasswordClick: () => setMode('recover'),
      onRegisterClick: () => controller.handleRegisterClick(onClose),
      onBackToLoginClick: () => setMode('login'),
      onEmailChange: (event) => setEmail(event.target.value),
      onRecoverSubmit: (event) => controller.handleRecoverSubmitEvent(event, email),
      onModeChange: (newMode) => controller.handleModeChange(newMode),
      onAuthorizeSubmit: (event) => controller.handleAuthorizeSubmitEvent(event, username),
      onAuthorizeReset: () => controller.handleAuthorizeReset(),
    }
  );
}

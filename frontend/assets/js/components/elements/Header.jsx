import { useEffect, useState } from 'react';
import HeaderController from './controllers/HeaderController.js';
import HeaderHelper from './helpers/HeaderHelper.jsx';
import AuthEvents from '../../utils/AuthEvents.js';

/**
 * Render application header, tracking authentication state and the login modal.
 *
 * @returns {React.ReactElement} Header element.
 */
export default function Header() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const controller = new HeaderController(setLoggedIn, setShowModal);

  useEffect(() => {
    controller.checkStatus();

    const handleAuthChanged = (event) => setLoggedIn(Boolean(event.detail?.loggedIn));

    AuthEvents.subscribe(handleAuthChanged);

    return () => AuthEvents.unsubscribe(handleAuthChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return HeaderHelper.render(
    { loggedIn, showModal },
    {
      onLoginClick: () => controller.handleLoginClick(),
      onLogoffClick: () => controller.handleLogoffClick(),
      onModalClose: () => controller.handleModalClose(),
      onLoginSuccess: () => controller.handleLoginSuccess(),
    }
  );
}

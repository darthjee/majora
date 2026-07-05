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
  const [testEmailStatus, setTestEmailStatus] = useState(null);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);
  const [isStaff, setIsStaff] = useState(false);
  const [route, setRoute] = useState(() => new HeaderController().getRoute());

  const controller = new HeaderController(
    setLoggedIn,
    setShowModal,
    setTestEmailStatus,
    setIsSuperUser,
    setServerStatus,
    undefined,
    undefined,
    setIsStaff,
    setRoute
  );

  useEffect(() => {
    controller.checkStatus();
    controller.startHealthCheck();

    const handleAuthChanged = (event) => setLoggedIn(Boolean(event.detail?.loggedIn));

    AuthEvents.subscribe(handleAuthChanged);

    const cleanupRoute = controller.buildRouteEffect()();

    return () => {
      controller.stopHealthCheck();
      AuthEvents.unsubscribe(handleAuthChanged);
      cleanupRoute();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return HeaderHelper.render(
    { loggedIn, showModal, testEmailStatus, isSuperUser, serverStatus, isStaff, route },
    {
      onLoginClick: () => controller.handleLoginClick(),
      onLogoffClick: () => controller.handleLogoffClick(),
      onModalClose: () => controller.handleModalClose(),
      onLoginSuccess: () => controller.handleLoginSuccess(),
      onSendTestEmailClick: () => controller.handleSendTestEmailClick(),
      onLanguageChange: (language) => controller.handleLanguageChange(language, loggedIn),
    }
  );
}

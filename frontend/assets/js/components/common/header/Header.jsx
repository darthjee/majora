import { useEffect, useRef, useState } from 'react';
import HeaderController from './controllers/HeaderController.js';
import HeaderViewAsController from './controllers/HeaderViewAsController.js';
import HeaderGameAccessController from './controllers/HeaderGameAccessController.js';
import HeaderHelper from './helpers/HeaderHelper.jsx';
import PendingApprovalPage from './PendingApprovalPage.jsx';
import AuthEvents from '../../../utils/auth/AuthEvents.js';
import AccessStore from '../../../utils/access/store/AccessStore.js';
import AccessEvents from '../../../utils/access/AccessEvents.js';

/**
 * Render application header, tracking authentication state and the login modal. Also gates the
 * requested route's content (issue #859): whenever the current user's account is `pending`
 * approval, the dedicated {@link PendingApprovalPage} is rendered below the nav bar instead of
 * `children`.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} [props.children] - Requested route's page content, rendered unless
 *   the current user is awaiting approval.
 * @returns {React.ReactElement} Header element.
 */
export default function Header({ children }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState(null);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [route, setRoute] = useState(() => new HeaderController().getRoute());
  const [gameAccess, setGameAccess] = useState(() => AccessStore.getGameAccess(route.gameSlug));
  const [canViewAs, setCanViewAs] = useState(false);
  const [showViewAsModal, setShowViewAsModal] = useState(false);
  const [facadeEnabled, setFacadeEnabled] = useState(() => AccessStore.getFacade().enabled);
  const [pendingApproval, setPendingApproval] = useState(false);
  const lastLoggedInRef = useRef(loggedIn);

  const controller = new HeaderController(
    setLoggedIn,
    setShowModal,
    setTestEmailStatus,
    setIsSuperUser,
    undefined,
    setIsStaff,
    setRoute,
    undefined,
    undefined,
    setPendingApproval
  );
  const viewAsController = new HeaderViewAsController(setCanViewAs, setShowViewAsModal);
  const gameAccessController = new HeaderGameAccessController(setGameAccess);

  useEffect(() => {
    controller.checkStatus();
    viewAsController.checkAvailability();

    const handleAuthChanged = (event) => {
      const newLoggedIn = Boolean(event.detail?.loggedIn);

      setLoggedIn(newLoggedIn);

      if (newLoggedIn === lastLoggedInRef.current) {
        return;
      }

      lastLoggedInRef.current = newLoggedIn;
      controller.recheckAuthState(viewAsController);
    };

    AuthEvents.subscribe(handleAuthChanged);

    const handleFacadeChanged = () => setFacadeEnabled(AccessStore.getFacade().enabled);

    AccessEvents.subscribeFacadeChanged(handleFacadeChanged);

    const cleanupRoute = controller.buildRouteEffect()();

    return () => {
      AuthEvents.unsubscribe(handleAuthChanged);
      AccessEvents.unsubscribeFacadeChanged(handleFacadeChanged);
      cleanupRoute();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => gameAccessController.buildEffect(route.gameSlug)(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [route.gameSlug]);

  return (
    <>
      {HeaderHelper.render(
        {
          loggedIn,
          showModal,
          testEmailStatus,
          isSuperUser,
          isStaff,
          route,
          gameAccess,
          canViewAs: canViewAs || Boolean(gameAccess.is_dm),
          showViewAsModal,
          facadeEnabled,
        },
        {
          onLoginClick: () => controller.handleLoginClick(),
          onLogoffClick: () => controller.handleLogoffClick(),
          onModalClose: () => controller.handleModalClose(),
          onLoginSuccess: () => controller.handleLoginSuccess(),
          onSendTestEmailClick: () => controller.handleSendTestEmailClick(),
          onLanguageChange: (language) => controller.handleLanguageChange(language, loggedIn),
          onViewAsClick: (event) => controller.handleViewAsClick(
            event, () => viewAsController.handleViewAsClick(),
          ),
          onViewAsModalClose: () => viewAsController.handleViewAsModalClose(),
        }
      )}
      {pendingApproval ? <PendingApprovalPage /> : children}
    </>
  );
}

import { useEffect, useState } from 'react';
import HeaderController from './controllers/HeaderController.js';
import HeaderViewAsController from './controllers/HeaderViewAsController.js';
import HeaderGameAccessController from './controllers/HeaderGameAccessController.js';
import HeaderHelper from './helpers/HeaderHelper.jsx';
import PendingApprovalPage from './PendingApprovalPage.jsx';
import AccessStore from '../../../utils/access/store/AccessStore.js';
import useHeaderAuthEffect from './hooks/useHeaderAuthEffect.js';

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
  const [domainConfig, setDomainConfig] = useState(null);

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
    setPendingApproval,
    undefined,
    setDomainConfig
  );
  const viewAsController = new HeaderViewAsController(setCanViewAs, setShowViewAsModal);
  const gameAccessController = new HeaderGameAccessController(setGameAccess);

  useHeaderAuthEffect({
    controller, viewAsController, setFacadeEnabled, loggedIn,
  });

  useEffect(() => gameAccessController.buildEffect(route.gameSlug)(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [route.gameSlug]);

  useEffect(() => { controller.fetchDomainConfig(); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []);

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
          domainConfig,
        },
        controller.buildHandlers(viewAsController, loggedIn)
      )}
      {pendingApproval ? <PendingApprovalPage /> : children}
    </>
  );
}

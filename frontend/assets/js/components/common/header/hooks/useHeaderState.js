import { useState } from 'react';
import HeaderController from '../controllers/HeaderController.js';
import AccessStore from '../../../../utils/access/store/AccessStore.js';

/**
 * Pre-fetch domain configuration, used until `HeaderController#fetchDomainConfig`
 * resolves. Mirrors `index.html`'s static `<title>Majora</title>`/favicon fallback, so
 * the navbar brand never flashes empty while the bootstrap request is in flight.
 */
const DEFAULT_DOMAIN_CONFIG = { favicon: null, title: 'Majora', subTitle: 'RPG' };

/**
 * Declares every piece of state owned by the Header component, along with its setters.
 *
 * @description Groups the `useState` declarations so `Header` itself stays small. The lazy
 *   initializers (current route, game access for that route, facade flag) run only once, on
 *   the first render.
 * @returns {{state: object, pendingApproval: boolean, setters: object}} `state` holds the
 *   values consumed by `HeaderHelper.render`, `pendingApproval` is the flag gating the
 *   route's content, and `setters` holds every state setter, keyed by its `setX` name.
 */
export default function useHeaderState() {
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
  const [domainConfig, setDomainConfig] = useState(DEFAULT_DOMAIN_CONFIG);

  return {
    state: {
      loggedIn,
      showModal,
      testEmailStatus,
      isSuperUser,
      isStaff,
      route,
      gameAccess,
      canViewAs,
      showViewAsModal,
      facadeEnabled,
      domainConfig,
    },
    pendingApproval,
    setters: {
      setLoggedIn,
      setShowModal,
      setTestEmailStatus,
      setIsSuperUser,
      setIsStaff,
      setRoute,
      setGameAccess,
      setCanViewAs,
      setShowViewAsModal,
      setFacadeEnabled,
      setPendingApproval,
      setDomainConfig,
    },
  };
}

export { DEFAULT_DOMAIN_CONFIG };

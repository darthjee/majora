import { useEffect, useMemo } from 'react';
import HeaderController from '../controllers/HeaderController.js';
import HeaderViewAsController from '../controllers/HeaderViewAsController.js';
import HeaderGameAccessController from '../controllers/HeaderGameAccessController.js';

/**
 * Builds Header's three controllers (`HeaderController`, `HeaderViewAsController`,
 * `HeaderGameAccessController`), wiring each of the setters `Header` owns as state. Extracted
 * as a plain function (rather than inlined in a `useMemo` callback) so it can be exercised
 * directly in specs without depending on React's hook timing. The setters are grouped per
 * controller and destructured in the body to keep the signature short.
 *
 * @param {object} headerSetters - State setters for `HeaderController`.
 * @param {Function} headerSetters.setLoggedIn - State setter for the logged-in flag.
 * @param {Function} headerSetters.setShowModal - State setter for the login modal visibility.
 * @param {Function} headerSetters.setTestEmailStatus - State setter for the test email status.
 * @param {Function} headerSetters.setIsSuperUser - State setter for the superuser flag.
 * @param {Function} headerSetters.setIsStaff - State setter for the staff flag.
 * @param {Function} headerSetters.setRoute - State setter for the current route info.
 * @param {Function} headerSetters.setPendingApproval - State setter for the "awaiting approval" flag.
 * @param {Function} headerSetters.setDomainConfig - State setter for the resolved domain configuration.
 * @param {object} viewAsSetters - State setters for `HeaderViewAsController`.
 * @param {Function} viewAsSetters.setCanViewAs - State setter for the view-as availability flag.
 * @param {Function} viewAsSetters.setShowViewAsModal - State setter for the view-as modal visibility.
 * @param {object} gameAccessSetters - State setters for `HeaderGameAccessController`.
 * @param {Function} gameAccessSetters.setGameAccess - State setter for the resolved game access.
 * @returns {{controller: HeaderController, viewAsController: HeaderViewAsController,
 *   gameAccessController: HeaderGameAccessController}} The three built controllers.
 */
function buildHeaderControllers(headerSetters, viewAsSetters, gameAccessSetters) {
  const {
    setLoggedIn, setShowModal, setTestEmailStatus, setIsSuperUser,
    setIsStaff, setRoute, setPendingApproval, setDomainConfig,
  } = headerSetters;
  const { setCanViewAs, setShowViewAsModal } = viewAsSetters;
  const { setGameAccess } = gameAccessSetters;

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

  return { controller, viewAsController, gameAccessController };
}

/**
 * Regroups the flat setters `Header` owns into one object per controller.
 *
 * @param {object} setters - Flat map of all Header state setters.
 * @returns {Array<object>} Tuple of `[headerSetters, viewAsSetters, gameAccessSetters]`, in the
 *   argument order expected by {@link buildHeaderControllers}.
 */
function groupSetters(setters) {
  const {
    setLoggedIn, setShowModal, setTestEmailStatus, setIsSuperUser,
    setIsStaff, setRoute, setPendingApproval, setDomainConfig,
    setCanViewAs, setShowViewAsModal, setGameAccess,
  } = setters;

  return [
    {
      setLoggedIn, setShowModal, setTestEmailStatus, setIsSuperUser,
      setIsStaff, setRoute, setPendingApproval, setDomainConfig,
    },
    { setCanViewAs, setShowViewAsModal },
    { setGameAccess },
  ];
}

/**
 * Builds and memoizes Header's three controllers, and wires the game-access effect (re-run
 * whenever `gameSlug` changes) and the mount-time domain-config-fetch effect.
 *
 * @param {object} params - Hook parameters: the flat setters, regrouped per controller before
 *   being passed to {@link buildHeaderControllers}, plus `gameSlug` below.
 * @param {Function} params.setLoggedIn - State setter for the logged-in flag.
 * @param {Function} params.setShowModal - State setter for the login modal visibility.
 * @param {Function} params.setTestEmailStatus - State setter for the test email status.
 * @param {Function} params.setIsSuperUser - State setter for the superuser flag.
 * @param {Function} params.setIsStaff - State setter for the staff flag.
 * @param {Function} params.setRoute - State setter for the current route info.
 * @param {Function} params.setPendingApproval - State setter for the "awaiting approval" flag.
 * @param {Function} params.setDomainConfig - State setter for the resolved domain configuration.
 * @param {Function} params.setCanViewAs - State setter for the view-as availability flag.
 * @param {Function} params.setShowViewAsModal - State setter for the view-as modal visibility.
 * @param {Function} params.setGameAccess - State setter for the resolved game access.
 * @param {(string|undefined)} params.gameSlug - Current route's game slug, if any.
 * @returns {{controller: HeaderController, viewAsController: HeaderViewAsController,
 *   gameAccessController: HeaderGameAccessController}} The three built controllers.
 */
export default function useHeaderControllers({ gameSlug, ...setters }) {
  const { controller, viewAsController, gameAccessController } = useMemo(
    () => buildHeaderControllers(...groupSetters(setters)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => gameAccessController.buildEffect(gameSlug)(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameSlug]);

  useEffect(() => { controller.fetchDomainConfig(); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []);

  return { controller, viewAsController, gameAccessController };
}

export { buildHeaderControllers };

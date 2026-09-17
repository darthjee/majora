import { useEffect, useMemo } from 'react';
import HeaderController from '../controllers/HeaderController.js';
import HeaderViewAsController from '../controllers/HeaderViewAsController.js';
import HeaderGameAccessController from '../controllers/HeaderGameAccessController.js';

/**
 * Builds Header's three controllers (`HeaderController`, `HeaderViewAsController`,
 * `HeaderGameAccessController`), wiring each of the setters `Header` owns as state. Extracted
 * as a plain function (rather than inlined in a `useMemo` callback) so it can be exercised
 * directly in specs without depending on React's hook timing.
 *
 * @param {object} params - Constructor parameters.
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
 * @returns {{controller: HeaderController, viewAsController: HeaderViewAsController,
 *   gameAccessController: HeaderGameAccessController}} The three built controllers.
 */
function buildHeaderControllers({
  setLoggedIn,
  setShowModal,
  setTestEmailStatus,
  setIsSuperUser,
  setIsStaff,
  setRoute,
  setPendingApproval,
  setDomainConfig,
  setCanViewAs,
  setShowViewAsModal,
  setGameAccess,
}) {
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
 * Builds and memoizes Header's three controllers, and wires the game-access effect (re-run
 * whenever `gameSlug` changes) and the mount-time domain-config-fetch effect.
 *
 * @param {object} params - Hook parameters, forwarded to {@link buildHeaderControllers} plus
 *   `gameSlug` below.
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
    () => buildHeaderControllers(setters),
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

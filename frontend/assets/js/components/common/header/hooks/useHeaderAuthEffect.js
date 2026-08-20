import { useEffect, useRef } from 'react';
import AuthEvents from '../../../../utils/auth/AuthEvents.js';
import AccessStore from '../../../../utils/access/store/AccessStore.js';
import AccessEvents from '../../../../utils/access/AccessEvents.js';

/**
 * Builds the Header's mount-time auth-lifecycle effect start function (mirrors
 * `HeaderController#buildRouteEffect`'s shape: called for its side effect, returning its own
 * cleanup). Extracted as a plain, non-hook function (rather than inlined in a `useEffect`
 * callback) so it can be exercised directly in specs without depending on React's effect
 * timing (`useEffect` callbacks never run under `renderToStaticMarkup`).
 *
 * @param {object} params - Effect parameters.
 * @param {HeaderController} params.controller - Owns `checkStatus()`, `setLoggedIn()`,
 *   `recheckAuthState()`, and `buildRouteEffect()`.
 * @param {HeaderViewAsController} params.viewAsController - Checked for view-as availability,
 *   both on mount and on a genuine logged-in transition.
 * @param {Function} params.setFacadeEnabled - State setter for the facade-enabled flag.
 * @param {{current: boolean}} params.lastLoggedInRef - Mutable ref-like box tracking the last
 *   known logged-in value, used to detect genuine logged-in transitions.
 * @returns {Function} Effect start function, returning its cleanup function.
 */
function buildAuthEffect({
  controller, viewAsController, setFacadeEnabled, lastLoggedInRef,
}) {
  return () => {
    controller.checkStatus().then(
      ({ isSuperUser: resolvedIsSuperUser, isStaff: resolvedIsStaff }) => viewAsController
        .checkAvailability(resolvedIsSuperUser, resolvedIsStaff)
    );

    const handleAuthChanged = (event) => {
      const newLoggedIn = Boolean(event.detail?.loggedIn);

      controller.setLoggedIn(newLoggedIn);

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
  };
}

/**
 * Wires the Header's mount-time auth-lifecycle effect: runs the initial status/view-as
 * availability checks, keeps `facadeEnabled` and the "genuine login transition" tracking
 * (via an internal `lastLoggedInRef`) in sync with `AuthEvents`/`AccessEvents`, and starts
 * the controller's route-hashchange effect — all torn down on unmount.
 *
 * @param {object} params - Hook parameters.
 * @param {HeaderController} params.controller - Owns `checkStatus()`, `setLoggedIn()`,
 *   `recheckAuthState()`, and `buildRouteEffect()`.
 * @param {HeaderViewAsController} params.viewAsController - Checked for view-as availability,
 *   both on mount and on a genuine logged-in transition.
 * @param {Function} params.setFacadeEnabled - State setter for the facade-enabled flag.
 * @param {boolean} params.loggedIn - Current logged-in value, used to seed this hook's
 *   internal `lastLoggedInRef`.
 * @returns {void}
 */
export default function useHeaderAuthEffect({
  controller, viewAsController, setFacadeEnabled, loggedIn,
}) {
  const lastLoggedInRef = useRef(loggedIn);

  useEffect(() => buildAuthEffect({
    controller, viewAsController, setFacadeEnabled, lastLoggedInRef,
  })(),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []);
}

export { buildAuthEffect };

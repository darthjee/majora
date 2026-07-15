import { useEffect } from 'react';
import AccessEvents from './AccessEvents.js';

/**
 * Subscribes to `AccessEvents`' facade-changed signal, re-running
 * `controller.buildEffect()()` each time it fires. Extracted as a plain,
 * non-hook function (rather than inlined in a `useEffect` callback) so it
 * can be exercised directly in specs without depending on React's effect
 * timing (`useEffect` callbacks never run under `renderToStaticMarkup`).
 *
 * @param {{buildEffect: Function}} controller - Page controller exposing
 *   `buildEffect()`, as already wired to the page's initial-load effect.
 * @returns {Function} Unsubscribe function, meant to be returned from a
 *   `useEffect` cleanup.
 */
function subscribe(controller) {
  const handleFacadeChanged = () => controller.buildEffect()();

  AccessEvents.subscribeFacadeChanged(handleFacadeChanged);
  return () => AccessEvents.unsubscribeFacadeChanged(handleFacadeChanged);
}

/**
 * Reusable page-level hook, so an already-mounted page's data-loading
 * effect re-runs in place when the "view as" facade changes, instead of
 * only reflecting it after navigating away and back to the page.
 *
 * @description Exposed as a method on a plain object (rather than a
 *   directly-exported function) so page specs can `spyOn` it to assert a
 *   page wires it with the right controller.
 */
const FacadeRefresh = {
  /**
   * Subscribes to the facade-changed signal for the lifetime of the calling
   * component, re-running `controller.buildEffect()()` each time it fires,
   * and unsubscribing on unmount.
   *
   * @param {{buildEffect: Function}} controller - Page controller exposing
   *   `buildEffect()`, as already wired to the page's initial-load effect.
   * @returns {void}
   */
  useFacadeRefresh(controller) {
    useEffect(() => subscribe(controller), [controller]);
  },
};

export default FacadeRefresh;
export { subscribe };

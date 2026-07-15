const ACCESS_CHANGED_EVENT = 'access:changed';
const ACCESS_FACADE_CHANGED_EVENT = 'access:facade-changed';

/**
 * Helper for emitting and subscribing to access-check state changes
 * through a `window`-level custom event.
 *
 * @description Also exposes a second, coarser channel
 *   (`access:facade-changed`) fired exactly once per `AccessStore.setFacade`
 *   call, so pages can re-run their data-loading effect on an actual "view
 *   as" change without being triggered by every ordinary first-load
 *   `access:changed` resolution.
 */
export default class AccessEvents {
  /**
   * Dispatches the `access:changed` event on `window` with the given detail.
   *
   * @param {{key: string}} detail - The access key that just resolved.
   * @returns {void}
   */
  static emit(detail) {
    if (typeof window === 'undefined') {
      return;
    }

    window.dispatchEvent(new CustomEvent(ACCESS_CHANGED_EVENT, { detail }));
  }

  /**
   * Subscribes a handler to the `access:changed` event.
   *
   * @param {Function} handler - Callback invoked when access state changes.
   * @returns {void}
   */
  static subscribe(handler) {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener(ACCESS_CHANGED_EVENT, handler);
  }

  /**
   * Unsubscribes a handler from the `access:changed` event.
   *
   * @param {Function} handler - Callback previously passed to `subscribe`.
   * @returns {void}
   */
  static unsubscribe(handler) {
    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener(ACCESS_CHANGED_EVENT, handler);
  }

  /**
   * Dispatches the `access:facade-changed` event on `window`, exactly once
   * per `AccessStore.setFacade` call.
   *
   * @returns {void}
   */
  static emitFacadeChanged() {
    if (typeof window === 'undefined') {
      return;
    }

    window.dispatchEvent(new CustomEvent(ACCESS_FACADE_CHANGED_EVENT));
  }

  /**
   * Subscribes a handler to the `access:facade-changed` event.
   *
   * @param {Function} handler - Callback invoked when the "view as" facade changes.
   * @returns {void}
   */
  static subscribeFacadeChanged(handler) {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener(ACCESS_FACADE_CHANGED_EVENT, handler);
  }

  /**
   * Unsubscribes a handler from the `access:facade-changed` event.
   *
   * @param {Function} handler - Callback previously passed to `subscribeFacadeChanged`.
   * @returns {void}
   */
  static unsubscribeFacadeChanged(handler) {
    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener(ACCESS_FACADE_CHANGED_EVENT, handler);
  }
}

const ACCESS_CHANGED_EVENT = 'access:changed';

/**
 * Helper for emitting and subscribing to access-check state changes
 * through a `window`-level custom event.
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
}

const AUTH_CHANGED_EVENT = 'auth:changed';

/**
 * Helper for emitting and subscribing to authentication state changes
 * through a `window`-level custom event.
 */
export default class AuthEvents {
  /**
   * Dispatches the `auth:changed` event on `window` with the given state.
   *
   * @param {boolean} loggedIn - Whether the user is currently logged in.
   * @returns {void}
   */
  static emit(loggedIn) {
    if (typeof window === 'undefined') {
      return;
    }

    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: { loggedIn } }));
  }

  /**
   * Subscribes a handler to the `auth:changed` event.
   *
   * @param {Function} handler - Callback invoked when auth state changes.
   * @returns {void}
   */
  static subscribe(handler) {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener(AUTH_CHANGED_EVENT, handler);
  }

  /**
   * Unsubscribes a handler from the `auth:changed` event.
   *
   * @param {Function} handler - Callback previously passed to `subscribe`.
   * @returns {void}
   */
  static unsubscribe(handler) {
    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener(AUTH_CHANGED_EVENT, handler);
  }
}

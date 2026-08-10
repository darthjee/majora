const NAMESPACE_LOADED_EVENT = 'i18n:namespace-loaded';

/**
 * Helper for emitting and subscribing to translation chunk loads
 * through a `window`-level custom event.
 *
 * Kept distinct from `LanguageEvents`' `language:changed` event: a chunk
 * finishing its load doesn't change the active language, so re-emitting
 * `language:changed` with an unchanged language string wouldn't trigger a
 * React remount (a state setter bails out on an identical primitive).
 */
export default class TranslationEvents {
  /**
   * Dispatches the `i18n:namespace-loaded` event on `window`.
   *
   * @returns {void}
   */
  static emit() {
    if (typeof window === 'undefined') {
      return;
    }

    window.dispatchEvent(new CustomEvent(NAMESPACE_LOADED_EVENT));
  }

  /**
   * Subscribes a handler to the `i18n:namespace-loaded` event.
   *
   * @param {Function} handler - Callback invoked when a chunk finishes loading.
   * @returns {void}
   */
  static subscribe(handler) {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener(NAMESPACE_LOADED_EVENT, handler);
  }

  /**
   * Unsubscribes a handler from the `i18n:namespace-loaded` event.
   *
   * @param {Function} handler - Callback previously passed to `subscribe`.
   * @returns {void}
   */
  static unsubscribe(handler) {
    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener(NAMESPACE_LOADED_EVENT, handler);
  }
}

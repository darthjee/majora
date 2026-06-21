const LANGUAGE_CHANGED_EVENT = 'language:changed';

/**
 * Helper for emitting and subscribing to language changes
 * through a `window`-level custom event.
 */
export default class LanguageEvents {
  /**
   * Dispatches the `language:changed` event on `window` with the given language.
   *
   * @param {string} language - The currently selected language code.
   * @returns {void}
   */
  static emit(language) {
    if (typeof window === 'undefined') {
      return;
    }

    window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGED_EVENT, { detail: { language } }));
  }

  /**
   * Subscribes a handler to the `language:changed` event.
   *
   * @param {Function} handler - Callback invoked when the language changes.
   * @returns {void}
   */
  static subscribe(handler) {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener(LANGUAGE_CHANGED_EVENT, handler);
  }

  /**
   * Unsubscribes a handler from the `language:changed` event.
   *
   * @param {Function} handler - Callback previously passed to `subscribe`.
   * @returns {void}
   */
  static unsubscribe(handler) {
    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener(LANGUAGE_CHANGED_EVENT, handler);
  }
}

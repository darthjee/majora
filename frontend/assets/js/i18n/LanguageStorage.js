const DEFAULT_LANGUAGE = 'en';

/**
 * Helper for persisting the selected language in `localStorage`, guarding
 * against environments where `localStorage` is unavailable (e.g. SSR/tests).
 */
export default class LanguageStorage {
  /**
   * Reads the persisted language code.
   *
   * @returns {string} the stored language code, or the default language when unavailable.
   */
  static getLanguage() {
    if (typeof localStorage === 'undefined') {
      return DEFAULT_LANGUAGE;
    }

    return localStorage.language ?? DEFAULT_LANGUAGE;
  }

  /**
   * Persists the given language code.
   *
   * @param {string} language - the language code to store.
   * @returns {void}
   */
  static setLanguage(language) {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.language = language;
  }
}

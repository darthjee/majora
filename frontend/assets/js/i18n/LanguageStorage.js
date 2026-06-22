const DEFAULT_LANGUAGE = 'en';

/**
 * Helper for persisting the selected language in `localStorage`, guarding
 * against environments where `localStorage` is unavailable (e.g. SSR/tests).
 */
export default class LanguageStorage {
  /**
   * Reads the persisted language code, falling back to the browser's
   * preferred language (when it matches a supported language) and finally
   * to the default language.
   *
   * @param {string[]} [supportedLanguages] - language codes the app can render.
   * @returns {string} the resolved language code.
   */
  static getLanguage(supportedLanguages = []) {
    if (typeof localStorage === 'undefined') {
      return DEFAULT_LANGUAGE;
    }

    return localStorage.language
      ?? LanguageStorage.#detectBrowserLanguage(supportedLanguages)
      ?? DEFAULT_LANGUAGE;
  }

  /**
   * Matches the browser's preferred languages against the supported ones.
   *
   * @param {string[]} supportedLanguages - language codes the app can render.
   * @returns {string|undefined} the first matching base language code, if any.
   */
  static #detectBrowserLanguage(supportedLanguages) {
    if (typeof navigator === 'undefined') {
      return undefined;
    }

    const candidates = navigator.languages ?? [navigator.language];

    return candidates
      .map((candidate) => candidate?.split('-')[0])
      .find((code) => supportedLanguages.includes(code));
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

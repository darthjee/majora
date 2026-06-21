import Translator from '../../../i18n/Translator.js';

const FLAGS = {
  en: '🇬🇧',
};

/**
 * Manages language selection state for the LanguageSelector element.
 */
export default class LanguageSelectorController {
  /**
   * Creates a new LanguageSelectorController instance.
   *
   * @param {Function} setLanguage - state setter for the current language code.
   * @param {Function} [onLanguageChange] - optional callback invoked with the new language code.
   */
  constructor(setLanguage, onLanguageChange = () => {}) {
    this.setLanguage = setLanguage;
    this.onLanguageChange = onLanguageChange;
  }

  /**
   * Returns the list of selectable language options, each with its code
   * and flag emoji.
   *
   * @returns {{code: string, flag: string}[]} the available language options.
   */
  getOptions() {
    return Translator.getAvailableLanguages().map((code) => ({
      code,
      flag: FLAGS[code] ?? '',
    }));
  }

  /**
   * Handles a language selection change, updating the translator and
   * the local state.
   *
   * @param {string} language - the newly selected language code.
   * @returns {void}
   */
  handleLanguageChange(language) {
    Translator.setLanguage(language);
    this.setLanguage(language);
    this.onLanguageChange(language);
  }
}

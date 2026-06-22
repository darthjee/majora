import { load } from 'js-yaml';
import enYaml from '../../i18n/en.yaml?raw';
import ptYaml from '../../i18n/pt.yaml?raw';
import LanguageEvents from './LanguageEvents.js';
import LanguageStorage from './LanguageStorage.js';

const TRANSLATIONS = {
  en: load(enYaml),
  pt: load(ptYaml),
};

const DEFAULT_LANGUAGE = 'en';

/**
 * Looks up a dot-path key (e.g. `header.login`) inside a nested translation map.
 *
 * @param {object} map - Nested translation map.
 * @param {string} key - Dot-separated key path.
 * @returns {string|undefined} the resolved value, or undefined when not found.
 */
function lookup(map, key) {
  return key.split('.').reduce((value, part) => {
    if (value === undefined || value === null) {
      return undefined;
    }

    return value[part];
  }, map);
}

/**
 * Singleton in-memory translator. Loads bundled YAML translation files at
 * module load time and exposes a `t(key)` dot-path lookup, plus language
 * selection backed by `LanguageStorage`/`LanguageEvents`.
 *
 * `en` and `pt` are bundled today; adding a new language means adding a new
 * `<code>.yaml` file under `frontend/assets/i18n/`, importing it above, and
 * registering it in the `TRANSLATIONS` table.
 */
export default class Translator {
  static #language = LanguageStorage.getLanguage(Object.keys(TRANSLATIONS)) || DEFAULT_LANGUAGE;

  /**
   * Returns the list of language codes available for selection.
   *
   * @returns {string[]} the registered language codes.
   */
  static getAvailableLanguages() {
    return Object.keys(TRANSLATIONS);
  }

  /**
   * Returns the currently selected language code.
   *
   * @returns {string} the current language code.
   */
  static getLanguage() {
    return Translator.#language;
  }

  /**
   * Sets the current language, persisting the choice and notifying
   * subscribers through `LanguageEvents`.
   *
   * @param {string} language - the language code to select.
   * @returns {void}
   */
  static setLanguage(language) {
    if (!TRANSLATIONS[language]) {
      return;
    }

    Translator.#language = language;
    LanguageStorage.setLanguage(language);
    LanguageEvents.emit(language);
  }

  /**
   * Translates the given dot-path key using the current language, falling
   * back to the given fallback (or the key itself) when missing.
   *
   * @param {string} key - dot-separated translation key (e.g. `header.login`).
   * @param {string} [fallback] - value returned when the key is not found.
   * @returns {string} the translated string, or the fallback when missing.
   */
  static t(key, fallback = key) {
    const map = TRANSLATIONS[Translator.#language] ?? TRANSLATIONS[DEFAULT_LANGUAGE];
    const value = lookup(map, key);

    return value ?? fallback;
  }
}

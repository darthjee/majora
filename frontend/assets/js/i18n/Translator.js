import { load } from 'js-yaml';
import enChunks from '../../i18n/en/index.js';
import ptChunks from '../../i18n/pt/index.js';
import LanguageEvents from './LanguageEvents.js';
import LanguageStorage from './LanguageStorage.js';

/**
 * Merges every raw YAML chunk of a language's manifest into one flat
 * namespace map.
 *
 * @param {object} chunks - Map of chunk name to raw YAML string content, as
 *   exported by a language's `index.js` manifest (e.g. `frontend/assets/i18n/en/index.js`).
 * @returns {object} the merged namespace map for that language.
 */
const mergeChunks = (chunks) =>
  Object.values(chunks).reduce((merged, raw) => Object.assign(merged, load(raw)), {});

const TRANSLATIONS = {
  en: mergeChunks(enChunks),
  pt: mergeChunks(ptChunks),
};

const DEFAULT_LANGUAGE = 'en';

/**
 * Singleton in-memory translator. Loads bundled YAML translation chunks at
 * module load time and exposes a `t(key)` dot-path lookup, plus language
 * selection backed by `LanguageStorage`/`LanguageEvents`.
 *
 * `en` and `pt` are bundled today; adding a new language means adding a new
 * `<code>/` directory under `frontend/assets/i18n/` (mirroring `en/`'s exact
 * file set, i.e. a `common.yaml` plus one file per page-specific namespace)
 * with its own `index.js` manifest, then importing that manifest above and
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
    const value = Translator.#lookup(map, key);

    return value ?? fallback;
  }

  /**
   * Looks up a dot-path key (e.g. `header.login`) inside a nested translation map.
   *
   * @param {object} map - Nested translation map.
   * @param {string} key - Dot-separated key path.
   * @returns {string|undefined} the resolved value, or undefined when not found.
   */
  static #lookup(map, key) {
    return key.split('.').reduce((value, part) => {
      if (value === undefined || value === null) {
        return undefined;
      }

      return value[part];
    }, map);
  }
}

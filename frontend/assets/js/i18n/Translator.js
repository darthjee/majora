import { load } from 'js-yaml';
import * as en from '../../i18n/en/index.js';
import * as pt from '../../i18n/pt/index.js';
import TranslationLoader from './TranslationLoader.js';
import LanguageEvents from './LanguageEvents.js';
import LanguageStorage from './LanguageStorage.js';

const MANIFESTS = { en, pt };
const DEFAULT_LANGUAGE = 'en';

/**
 * Resolves the language active at module load time, mirroring
 * `LanguageStorage`'s persisted-choice/browser-detection/default fallback
 * chain.
 *
 * @returns {string} the resolved startup language code.
 */
const resolveInitialLanguage = () =>
  LanguageStorage.getLanguage(Object.keys(MANIFESTS)) || DEFAULT_LANGUAGE;

const INITIAL_LANGUAGE = resolveInitialLanguage();

/**
 * Eagerly parsed `common` chunk for the startup-active language only — kept
 * outside `TranslationLoader`'s lazy cache so header/chrome elements never
 * flash untranslated on first paint. Every other chunk, for every language
 * (including `common` for a language switched into later), loads lazily
 * through `TranslationLoader`.
 */
const INITIAL_COMMON = load(MANIFESTS[INITIAL_LANGUAGE].default);

/**
 * Singleton in-memory translator exposing a `t(key)` dot-path lookup, plus
 * language selection backed by `LanguageStorage`/`LanguageEvents`.
 *
 * Only the startup-active language's `common` chunk (shared namespaces —
 * `header`, modals, `pagination`, etc.) is bundled/parsed eagerly. Every
 * other namespace loads lazily, on first use, through `TranslationLoader` —
 * triggered implicitly by `t()` itself, with no call-site changes anywhere.
 *
 * `en` and `pt` are bundled today; adding a new language means adding a new
 * `<code>/` directory under `frontend/assets/i18n/` (mirroring `en/`'s exact
 * file set, i.e. a `common.yaml` plus one file per page-specific namespace)
 * with its own `index.js` manifest, then importing that manifest above and
 * registering it in the `MANIFESTS` table.
 */
export default class Translator {
  static #language = INITIAL_LANGUAGE;

  /**
   * Returns the list of language codes available for selection.
   *
   * @returns {string[]} the registered language codes.
   */
  static getAvailableLanguages() {
    return Object.keys(MANIFESTS);
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
   * subscribers through `LanguageEvents`. Does not eagerly reload any
   * chunk for the new language — the resulting remount causes visible
   * components to call `t()` again, which naturally re-triggers loads for
   * whatever the new language needs through `TranslationLoader`.
   *
   * @param {string} language - the language code to select.
   * @returns {void}
   */
  static setLanguage(language) {
    if (!MANIFESTS[language]) {
      return;
    }

    Translator.#language = language;
    LanguageStorage.setLanguage(language);
    LanguageEvents.emit(language);
  }

  /**
   * Translates the given dot-path key using the current language, falling
   * back to the given fallback (or the key itself) when missing. A miss
   * triggers a background load of the owning chunk through
   * `TranslationLoader`; the key resolves once that load settles and the
   * app remounts.
   *
   * @param {string} key - dot-separated translation key (e.g. `header.login`).
   * @param {string} [fallback] - value returned when the key is not found.
   * @returns {string} the translated string, or the fallback when missing.
   */
  static t(key, fallback = key) {
    const language = Translator.#language;
    const chunkName = Translator.#chunkName(language, key);
    const data = Translator.#resolveChunk(language, chunkName);

    if (data === undefined) {
      TranslationLoader.request(language, chunkName);

      return fallback;
    }

    return Translator.#lookup(data, key) ?? fallback;
  }

  /**
   * Resolves the chunk name owning a given key, routing shared namespaces
   * bundled inside `common.yaml` to the `common` chunk.
   *
   * @param {string} language - the language code the key is looked up for.
   * @param {string} key - dot-separated translation key.
   * @returns {string} the resolved chunk name.
   */
  static #chunkName(language, key) {
    const namespace = key.split('.')[0];
    const manifest = MANIFESTS[language] ?? MANIFESTS[DEFAULT_LANGUAGE];

    return manifest.commonNamespaces.includes(namespace) ? 'common' : namespace;
  }

  /**
   * Resolves a chunk's parsed data, preferring the eagerly-parsed startup
   * `common` chunk before falling through to `TranslationLoader`'s cache.
   *
   * @param {string} language - the language code to resolve the chunk for.
   * @param {string} chunkName - the chunk name to resolve.
   * @returns {object|undefined} the parsed chunk data, or undefined when
   *   not (yet) loaded.
   */
  static #resolveChunk(language, chunkName) {
    if (chunkName === 'common' && language === INITIAL_LANGUAGE) {
      return INITIAL_COMMON;
    }

    return TranslationLoader.get(language, chunkName);
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

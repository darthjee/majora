import { load } from 'js-yaml';
import * as en from '../../i18n/en/index.js';
import * as pt from '../../i18n/pt/index.js';
import Translator from './Translator.js';
import TranslationEvents from './TranslationEvents.js';

const MANIFESTS = { en, pt };

/**
 * Plain module-level singleton that lazily loads each `(language,
 * namespace)` translation chunk on first request and caches it permanently
 * for the session — mirroring the project's other small single-responsibility
 * i18n helpers (`LanguageStorage`, `LanguageEvents`).
 *
 * Entries are never deleted, regardless of state: a dynamic `import()`
 * cannot be cancelled at the network level, so a chunk that started loading
 * before a language switch keeps loading in the background and is cached
 * silently on resolve, avoiding a duplicate fetch if the user switches back.
 */
export default class TranslationLoader {
  static #entries = new Map();

  /**
   * Requests a translation chunk for the given language/namespace pair,
   * kicking off a dynamic import when no entry exists yet for that key.
   * A second call for the same pair, in any state, is a no-op — this is the
   * dedupe. The check-then-set is synchronous (no `await` before marking the
   * entry `loading`), so two `t()` calls racing to request the same
   * namespace in the same render pass can't both fire a duplicate import.
   *
   * @param {string} language - The language code to load the chunk for.
   * @param {string} namespace - The chunk name to load (a page-specific
   *   namespace, or `common`).
   * @returns {void}
   */
  static request(language, namespace) {
    const key = TranslationLoader.#key(language, namespace);

    if (TranslationLoader.#entries.has(key)) {
      return;
    }

    const entry = { language, namespace, state: 'loading', data: undefined };
    TranslationLoader.#entries.set(key, entry);
    TranslationLoader.#load(entry);
  }

  /**
   * Returns the cached, parsed chunk data for the given language/namespace
   * pair, when it has finished loading.
   *
   * @param {string} language - The language code to read the chunk for.
   * @param {string} namespace - The chunk name to read (a page-specific
   *   namespace, or `common`).
   * @returns {object|undefined} the parsed chunk data, or `undefined` when
   *   not yet requested, still loading, or failed.
   */
  static get(language, namespace) {
    const entry = TranslationLoader.#entries.get(TranslationLoader.#key(language, namespace));

    return entry?.state === 'loaded' ? entry.data : undefined;
  }

  /**
   * Builds the internal map key for a language/namespace pair.
   *
   * @param {string} language - The language code.
   * @param {string} namespace - The chunk name.
   * @returns {string} the map key.
   */
  static #key(language, namespace) {
    return `${language}:${namespace}`;
  }

  /**
   * Resolves the chunk file for a language/namespace pair, either via the
   * language's already-bundled `common` chunk or its lazy `chunkLoaders`
   * thunk, and returns its raw `?raw` YAML text.
   *
   * @param {string} language - The language code to resolve the chunk for.
   * @param {string} namespace - The chunk name to resolve.
   * @returns {Promise<string>} the raw YAML text for the chunk.
   */
  static async #fetchRaw(language, namespace) {
    const manifest = MANIFESTS[language];

    if (namespace === 'common') {
      return manifest.default;
    }

    const chunk = await manifest.chunkLoaders[namespace]();

    return chunk.default;
  }

  /**
   * Loads and caches a pending entry, flipping its state to `loaded` and
   * notifying subscribers on success — only when the requested language is
   * still active — or to `failed` on a rejected import.
   *
   * @param {object} entry - The pending entry to resolve.
   * @returns {Promise<void>} resolves once the entry has settled.
   */
  static async #load(entry) {
    try {
      const raw = await TranslationLoader.#fetchRaw(entry.language, entry.namespace);
      entry.data = load(raw);
      entry.state = 'loaded';

      if (entry.language === Translator.getLanguage()) {
        TranslationEvents.emit();
      }
    } catch {
      entry.state = 'failed';
    }
  }
}

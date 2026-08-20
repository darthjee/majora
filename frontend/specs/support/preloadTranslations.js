import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Translator from '../../assets/js/i18n/Translator.js';
import TranslationLoader from '../../assets/js/i18n/TranslationLoader.js';
import * as en from '../../assets/i18n/en/index.js';
import * as pt from '../../assets/i18n/pt/index.js';

// The wider spec suite pre-dates lazy loading and asserts translated text
// synchronously (`renderToStaticMarkup`, direct string equality, ...) for
// every page namespace, in every language, without awaiting `TranslationLoader`.
// Rather than touching every one of those specs, warm its cache for every
// real chunk before any spec runs, so `Translator.t()` resolves synchronously
// everywhere.
//
// `TranslationLoaderSpec.js`/`TranslatorSpec.js` exercise the genuine lazy
// path (cache miss -> fallback -> resolve) against disposable, fictional
// namespaces they register themselves at test time — never against a real
// chunk — since `TranslationLoader`'s cache is a permanent, module-level
// singleton shared across the whole run and any real chunk could otherwise
// get organically warmed by some other spec's render first.
const MANIFESTS = { en, pt };
const INITIAL_LANGUAGE = Translator.getLanguage();

/**
 * Lists every page-specific namespace for a language by reading its i18n
 * directory directly off disk, since `manifest.chunkLoaders` is now a
 * `Proxy` with no real own keys until a namespace has been requested or
 * overridden by a spec fixture (see docs/agents/i18n.md).
 *
 * @param {string} language - The language code whose directory to list.
 * @returns {string[]} namespace names (file basenames without `.yaml`), excluding `common`.
 */
const listNamespaces = (language) => {
  const dir = join(dirname(fileURLToPath(import.meta.url)), '../../assets/i18n', language);

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- dir is join(__dirname, '../../assets/i18n', language) where language always comes from this file's own MANIFESTS keys ('en', 'pt'), never external input.
  return readdirSync(dir)
    .filter((file) => file.endsWith('.yaml') && file !== 'common.yaml')
    .map((file) => file.replace(/\.yaml$/, ''));
};

/**
 * Waits for a `TranslationLoader` entry to settle by polling `.get()` on
 * consecutive macrotask ticks (`TranslationLoader` exposes no promise to
 * await directly).
 *
 * @param {string} language - The language code to wait for.
 * @param {string} namespace - The chunk name to wait for.
 * @returns {Promise<void>} resolves once the chunk is cached.
 */
const waitForLoad = (language, namespace) => new Promise((resolve) => {
  const poll = () => {
    if (TranslationLoader.get(language, namespace) !== undefined) {
      resolve();

      return;
    }

    setTimeout(poll, 0);
  };

  poll();
});

/**
 * Requests and awaits a single chunk, skipping the one combination
 * `Translator` already resolves synchronously without `TranslationLoader`
 * (the startup-active language's `common` chunk).
 *
 * @param {string} language - The language code to preload.
 * @param {string} namespace - The chunk name to preload.
 * @returns {Promise<void>} resolves once the chunk is cached.
 */
const preloadNamespace = (language, namespace) => {
  if (language === INITIAL_LANGUAGE && namespace === 'common') {
    return Promise.resolve();
  }

  TranslationLoader.request(language, namespace);

  return waitForLoad(language, namespace);
};

beforeAll(async function() {
  const tasks = Object.keys(MANIFESTS).flatMap((language) => {
    const namespaces = ['common', ...listNamespaces(language)];

    return namespaces.map((namespace) => preloadNamespace(language, namespace));
  });

  await Promise.all(tasks);
});

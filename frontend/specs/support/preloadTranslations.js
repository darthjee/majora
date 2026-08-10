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
  const tasks = Object.entries(MANIFESTS).flatMap(([language, manifest]) => {
    const namespaces = ['common', ...Object.keys(manifest.chunkLoaders)];

    return namespaces.map((namespace) => preloadNamespace(language, namespace));
  });

  await Promise.all(tasks);
});

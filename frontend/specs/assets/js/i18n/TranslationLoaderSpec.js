import TranslationLoader from '../../../../assets/js/i18n/TranslationLoader.js';
import TranslationEvents from '../../../../assets/js/i18n/TranslationEvents.js';
import Translator from '../../../../assets/js/i18n/Translator.js';
import MajoraLogger from '../../../../assets/js/utils/logging/MajoraLogger.js';
import * as en from '../../../../assets/i18n/en/index.js';
import * as pt from '../../../../assets/i18n/pt/index.js';

// `TranslationLoader`'s cache is a permanent, module-level singleton shared
// across the whole spec run, and real page namespaces can get organically
// warmed by any other spec's render (even one that never asserts on the
// translated text). To observe a genuine, never-touched-before cache miss,
// each `it` below registers its own disposable, fictional namespace key
// directly on a manifest's (mutable) `chunkLoaders` object — exercising the
// exact same resolution path as a real namespace, with zero chance of
// collision with anything else in the suite.
const waitUntil = (predicate) => new Promise((resolve) => {
  const poll = () => {
    if (predicate()) {
      resolve();

      return;
    }

    setTimeout(poll, 0);
  };

  poll();
});

// A rejected import settles into the `failed` state (never `loaded`), so it
// can't be detected via a `!== undefined` predicate like a successful load —
// `get()` reads `undefined` both before and after settling. `MajoraLogger.warn`
// is called synchronously right after the entry flips to `failed` (see
// `TranslationLoader#load`'s `catch` block), so polling for that specific
// namespace's warn call is a reliable settle signal for both. A fixed number
// of macrotask ticks isn't: the rejection round-trips through a real dynamic
// `import()` (genuine filesystem resolution), whose latency isn't bounded by
// tick count under CI load, which made this flaky under random ordering.
const waitForFailedLoad = (spy, namespace) => waitUntil(
  () => spy.calls.all().some((call) => call.args[0]?.namespace === namespace)
);

const registerFakeChunk = (manifest, namespace, yaml) => {
  manifest.chunkLoaders[namespace] = jasmine.createSpy(namespace).and.returnValue(Promise.resolve({ default: yaml }));
};

describe('TranslationLoader', function() {
  let warnSpy;

  beforeEach(function() {
    warnSpy = spyOn(MajoraLogger, 'warn');
  });

  afterEach(function() {
    Translator.setLanguage('en');
  });

  describe('.request', function() {
    it('dedupes concurrent requests for the same language/namespace pair', async function() {
      const namespace = 'loader_spec_dedupe';
      registerFakeChunk(en, namespace, `${namespace}:\n  greeting: Hello\n`);

      TranslationLoader.request('en', namespace);
      TranslationLoader.request('en', namespace);

      await waitUntil(() => TranslationLoader.get('en', namespace) !== undefined);

      expect(en.chunkLoaders[namespace]).toHaveBeenCalledTimes(1);
      expect(TranslationLoader.get('en', namespace)[namespace].greeting).toBe('Hello');
    });
  });

  describe('.get', function() {
    it('returns undefined before the chunk has been requested', function() {
      expect(TranslationLoader.get('en', 'never_requested_namespace')).toBeUndefined();
    });

    it('keeps a loaded entry cached permanently, including across a language switch', async function() {
      const namespace = 'loader_spec_permanent_cache';
      registerFakeChunk(pt, namespace, `${namespace}:\n  greeting: Ola\n`);

      TranslationLoader.request('pt', namespace);
      await waitUntil(() => TranslationLoader.get('pt', namespace) !== undefined);

      const loaded = TranslationLoader.get('pt', namespace);

      Translator.setLanguage('pt');
      Translator.setLanguage('en');

      expect(TranslationLoader.get('pt', namespace)).toBe(loaded);
    });

    it('flips a rejected import to a failed state and returns undefined', async function() {
      const namespace = 'loader_spec_missing_namespace';

      TranslationLoader.request('en', namespace);

      await waitForFailedLoad(warnSpy, namespace);

      expect(TranslationLoader.get('en', namespace)).toBeUndefined();

      // A second request for the same (already-settled) key stays a no-op dedupe,
      // regardless of the failed state — there is no retry.
      expect(() => TranslationLoader.request('en', namespace)).not.toThrow();
      expect(TranslationLoader.get('en', namespace)).toBeUndefined();
    });

    it('logs the rejected import at warn level with the language, namespace, and error', async function() {
      const namespace = 'loader_spec_missing_namespace_logging';

      TranslationLoader.request('en', namespace);

      await waitForFailedLoad(warnSpy, namespace);

      expect(warnSpy).toHaveBeenCalledWith({
        event: 'translation-chunk-load-failed',
        language: 'en',
        namespace,
        error: jasmine.any(Error),
      });
    });

    it('does not emit a load event when the language is no longer active at resolve time', async function() {
      const namespace = 'loader_spec_inactive_language';
      registerFakeChunk(pt, namespace, `${namespace}:\n  greeting: Ola\n`);
      spyOn(TranslationEvents, 'emit');

      TranslationLoader.request('pt', namespace);
      await waitUntil(() => TranslationLoader.get('pt', namespace) !== undefined);

      expect(Translator.getLanguage()).toBe('en');
      expect(TranslationEvents.emit).not.toHaveBeenCalled();
    });
  });
});

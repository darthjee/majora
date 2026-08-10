import Translator from '../../../../assets/js/i18n/Translator.js';
import * as en from '../../../../assets/i18n/en/index.js';

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

describe('Translator', function() {
  afterEach(function() {
    Translator.setLanguage('en');
  });

  describe('.t', function() {
    it('resolves a nested dot-path key', function() {
      expect(Translator.t('header.login')).toBe('Login');
    });

    it('returns the key itself when missing and no fallback is given', function() {
      expect(Translator.t('missing.key')).toBe('missing.key');
    });

    it('returns the given fallback when the key is missing', function() {
      expect(Translator.t('missing.key', 'fallback value')).toBe('fallback value');
    });

    // Registers a disposable, fictional namespace directly on `en`'s
    // (mutable) `chunkLoaders` manifest, so this exercises the genuine lazy
    // path against a chunk `TranslationLoader` has never seen before: a miss
    // returns the fallback and triggers a background load, which resolves
    // the key once the underlying dynamic import settles.
    it('returns the fallback on first call and resolves once the chunk loads', async function() {
      const namespace = 'translator_spec_lazy_namespace';
      en.chunkLoaders[namespace] = () => Promise.resolve({ default: `${namespace}:\n  greeting: Hello\n` });

      expect(Translator.t(`${namespace}.greeting`, 'fallback greeting')).toBe('fallback greeting');

      await waitUntil(() => Translator.t(`${namespace}.greeting`, 'fallback greeting') !== 'fallback greeting');

      expect(Translator.t(`${namespace}.greeting`)).toBe('Hello');
    });
  });

  describe('.getLanguage', function() {
    it('defaults to en', function() {
      expect(Translator.getLanguage()).toBe('en');
    });
  });

  describe('.getAvailableLanguages', function() {
    it('includes en', function() {
      expect(Translator.getAvailableLanguages()).toContain('en');
    });
  });

  describe('.setLanguage', function() {
    it('updates the current language for a registered language', function() {
      Translator.setLanguage('en');
      expect(Translator.getLanguage()).toBe('en');
    });

    it('ignores unregistered languages', function() {
      Translator.setLanguage('xx');
      expect(Translator.getLanguage()).toBe('en');
    });

    it('does not throw when emitting the language change event', function() {
      expect(() => Translator.setLanguage('en')).not.toThrow();
    });
  });
});

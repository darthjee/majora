import Translator from '../../../../assets/js/i18n/Translator.js';

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

import LanguageStorage from '../../../../assets/js/i18n/LanguageStorage.js';

describe('LanguageStorage', function() {
  describe('when localStorage is unavailable', function() {
    it('.getLanguage returns the default language without throwing', function() {
      expect(LanguageStorage.getLanguage()).toBe('en');
    });

    it('.setLanguage does not throw', function() {
      expect(() => LanguageStorage.setLanguage('en')).not.toThrow();
    });
  });

  describe('when localStorage and navigator are available', function() {
    const originalNavigator = globalThis.navigator;

    function stubNavigatorLanguages(languages) {
      Object.defineProperty(globalThis, 'navigator', {
        value: { languages },
        configurable: true,
      });
    }

    beforeEach(function() {
      globalThis.localStorage = {};
    });

    afterEach(function() {
      delete globalThis.localStorage;
      Object.defineProperty(globalThis, 'navigator', { value: originalNavigator, configurable: true });
    });

    describe('and localStorage has no stored language', function() {
      it('uses the browser language when it is supported', function() {
        stubNavigatorLanguages(['pt']);

        expect(LanguageStorage.getLanguage(['en', 'pt'])).toBe('pt');
      });

      it('normalizes region-qualified browser languages to their base code', function() {
        stubNavigatorLanguages(['pt-BR']);

        expect(LanguageStorage.getLanguage(['en', 'pt'])).toBe('pt');
      });

      it('falls back to the default language when the browser language is unsupported', function() {
        stubNavigatorLanguages(['fr']);

        expect(LanguageStorage.getLanguage(['en', 'pt'])).toBe('en');
      });

      it('falls back to the default language when no supported languages are given', function() {
        stubNavigatorLanguages(['pt']);

        expect(LanguageStorage.getLanguage()).toBe('en');
      });
    });

    describe('and localStorage already has a stored language', function() {
      it('takes priority over the browser language', function() {
        globalThis.localStorage.language = 'en';
        stubNavigatorLanguages(['pt']);

        expect(LanguageStorage.getLanguage(['en', 'pt'])).toBe('en');
      });
    });
  });
});

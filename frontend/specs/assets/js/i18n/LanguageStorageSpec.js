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
});

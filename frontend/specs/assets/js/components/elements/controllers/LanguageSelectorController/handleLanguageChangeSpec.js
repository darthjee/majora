import LanguageSelectorController from '../../../../../../../assets/js/components/elements/controllers/LanguageSelectorController.js';
import Translator from '../../../../../../../assets/js/i18n/Translator.js';

describe('LanguageSelectorController', function() {
  let setLanguage;

  beforeEach(function() {
    setLanguage = jasmine.createSpy('setLanguage');
  });

  afterEach(function() {
    Translator.setLanguage('en');
  });

  describe('#handleLanguageChange', function() {
    it('updates the Translator language and the local state', function() {
      spyOn(Translator, 'setLanguage');
      const controller = new LanguageSelectorController(setLanguage);

      controller.handleLanguageChange('en');

      expect(Translator.setLanguage).toHaveBeenCalledWith('en');
      expect(setLanguage).toHaveBeenCalledWith('en');
    });

    it('invokes the onLanguageChange callback when provided', function() {
      spyOn(Translator, 'setLanguage');
      const onLanguageChange = jasmine.createSpy('onLanguageChange');
      const controller = new LanguageSelectorController(setLanguage, onLanguageChange);

      controller.handleLanguageChange('en');

      expect(onLanguageChange).toHaveBeenCalledWith('en');
    });

    it('does not throw when no onLanguageChange callback is provided', function() {
      spyOn(Translator, 'setLanguage');
      const controller = new LanguageSelectorController(setLanguage);

      expect(() => controller.handleLanguageChange('en')).not.toThrow();
    });
  });
});

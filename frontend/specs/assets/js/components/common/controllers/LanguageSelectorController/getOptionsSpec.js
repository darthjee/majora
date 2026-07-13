import LanguageSelectorController from '../../../../../../../assets/js/components/common/controllers/LanguageSelectorController.js';
import Translator from '../../../../../../../assets/js/i18n/Translator.js';

describe('LanguageSelectorController', function() {
  let setLanguage;

  beforeEach(function() {
    setLanguage = jasmine.createSpy('setLanguage');
  });

  afterEach(function() {
    Translator.setLanguage('en');
  });

  describe('#getOptions', function() {
    it('returns an option for every available language with a flag', function() {
      const controller = new LanguageSelectorController(setLanguage);

      expect(controller.getOptions()).toEqual([
        { code: 'en', flag: '🇬🇧' },
        { code: 'pt', flag: '🇧🇷' },
      ]);
    });
  });
});

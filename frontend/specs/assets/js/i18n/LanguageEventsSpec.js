import LanguageEvents from '../../../../assets/js/i18n/LanguageEvents.js';
import Noop from '../../../../assets/js/utils/Noop.js';

describe('LanguageEvents', function() {
  describe('.emit', function() {
    it('does not throw when window is unavailable', function() {
      expect(() => LanguageEvents.emit('en')).not.toThrow();
    });
  });

  describe('.subscribe', function() {
    it('does not throw when window is unavailable', function() {
      expect(() => LanguageEvents.subscribe(Noop.noop)).not.toThrow();
    });
  });

  describe('.unsubscribe', function() {
    it('does not throw when window is unavailable', function() {
      expect(() => LanguageEvents.unsubscribe(Noop.noop)).not.toThrow();
    });
  });
});

import TranslationEvents from '../../../../assets/js/i18n/TranslationEvents.js';
import Noop from '../../../../assets/js/utils/Noop.js';

describe('TranslationEvents', function() {
  describe('.emit', function() {
    it('does not throw when window is unavailable', function() {
      expect(() => TranslationEvents.emit()).not.toThrow();
    });
  });

  describe('.subscribe', function() {
    it('does not throw when window is unavailable', function() {
      expect(() => TranslationEvents.subscribe(Noop.noop)).not.toThrow();
    });
  });

  describe('.unsubscribe', function() {
    it('does not throw when window is unavailable', function() {
      expect(() => TranslationEvents.unsubscribe(Noop.noop)).not.toThrow();
    });
  });
});

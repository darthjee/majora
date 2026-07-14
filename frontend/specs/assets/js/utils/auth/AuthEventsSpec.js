import AuthEvents from '../../../../../assets/js/utils/auth/AuthEvents.js';
import Noop from '../../../../../assets/js/utils/Noop.js';

describe('AuthEvents', function() {
  describe('.emit', function() {
    it('does not throw when window is unavailable', function() {
      expect(() => AuthEvents.emit(true)).not.toThrow();
    });
  });

  describe('.subscribe', function() {
    it('does not throw when window is unavailable', function() {
      expect(() => AuthEvents.subscribe(Noop.noop)).not.toThrow();
    });
  });

  describe('.unsubscribe', function() {
    it('does not throw when window is unavailable', function() {
      expect(() => AuthEvents.unsubscribe(Noop.noop)).not.toThrow();
    });
  });
});

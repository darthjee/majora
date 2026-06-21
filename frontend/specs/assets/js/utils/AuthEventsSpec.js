import AuthEvents from '../../../../assets/js/utils/AuthEvents.js';

describe('AuthEvents', function() {
  describe('.emit', function() {
    it('does not throw when window is unavailable', function() {
      expect(() => AuthEvents.emit(true)).not.toThrow();
    });
  });

  describe('.subscribe', function() {
    it('does not throw when window is unavailable', function() {
      expect(() => AuthEvents.subscribe(() => {})).not.toThrow();
    });
  });

  describe('.unsubscribe', function() {
    it('does not throw when window is unavailable', function() {
      expect(() => AuthEvents.unsubscribe(() => {})).not.toThrow();
    });
  });
});

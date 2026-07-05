import Noop from '../../../../assets/js/utils/Noop.js';

describe('Noop', function() {
  describe('.noop', function() {
    it('is a function', function() {
      expect(typeof Noop.noop).toBe('function');
    });

    it('does not throw when called', function() {
      expect(() => Noop.noop()).not.toThrow();
    });

    it('returns undefined', function() {
      expect(Noop.noop()).toBeUndefined();
    });
  });
});

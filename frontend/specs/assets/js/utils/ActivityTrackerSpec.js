import ActivityTracker from '../../../../assets/js/utils/ActivityTracker.js';

describe('ActivityTracker', function() {
  describe('.register', function() {
    it('updates the last activity timestamp to the current time', function() {
      const before = Date.now();
      ActivityTracker.register();
      const after = Date.now();

      const activity = ActivityTracker.getLastActivity();
      expect(activity).toBeGreaterThanOrEqual(before);
      expect(activity).toBeLessThanOrEqual(after);
    });

    it('updates the timestamp on each subsequent call', function() {
      ActivityTracker.register();
      const first = ActivityTracker.getLastActivity();

      ActivityTracker.register();
      const second = ActivityTracker.getLastActivity();

      expect(second).toBeGreaterThanOrEqual(first);
    });
  });

  describe('.getLastActivity', function() {
    it('returns the timestamp set by register()', function() {
      ActivityTracker.register();
      const activity = ActivityTracker.getLastActivity();

      expect(typeof activity).toBe('number');
    });
  });
});

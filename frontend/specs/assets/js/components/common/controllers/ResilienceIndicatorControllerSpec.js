import ResilienceIndicatorController
  from '../../../../../../assets/js/components/common/controllers/ResilienceIndicatorController.js';
import ResilienceEvents from '../../../../../../assets/js/utils/logging/ResilienceEvents.js';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('ResilienceIndicatorController', function() {
  describe('#getStatus', function() {
    it('returns the current global resilience status', function() {
      const controller = new ResilienceIndicatorController(Noop.noop);

      expect(controller.getStatus()).toBe('idle');

      ResilienceEvents.requestStarted();

      expect(controller.getStatus()).toBe('requesting');

      ResilienceEvents.requestSucceeded();
    });
  });

  describe('#handleChange', function() {
    it('syncs local state with the current global status', function() {
      const setStatus = jasmine.createSpy('setStatus');
      const controller = new ResilienceIndicatorController(setStatus);

      ResilienceEvents.requestStarted();
      controller.handleChange();

      expect(setStatus).toHaveBeenCalledWith('requesting');

      ResilienceEvents.requestSucceeded();
    });
  });
});

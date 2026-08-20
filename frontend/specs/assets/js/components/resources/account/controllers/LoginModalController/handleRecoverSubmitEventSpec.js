import LoginModalController from '../../../../../../../../assets/js/components/resources/account/controllers/LoginModalController.js';

describe('LoginModalController', function() {
  let controller;

  beforeEach(function() {
    controller = new LoginModalController(
      jasmine.createSpy('setUsername'),
      jasmine.createSpy('setPassword'),
      jasmine.createSpy('setIncorrect'),
      jasmine.createSpy('setError')
    );
  });

  describe('#handleRecoverSubmitEvent', function() {
    it('prevents the default form submission', function() {
      const event = { preventDefault: jasmine.createSpy('preventDefault') };
      spyOn(controller, 'handleRecoverSubmit');

      controller.handleRecoverSubmitEvent(event, 'user@example.com');

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('delegates to handleRecoverSubmit with the given email', function() {
      spyOn(controller, 'handleRecoverSubmit');

      controller.handleRecoverSubmitEvent({ preventDefault: jasmine.createSpy() }, 'user@example.com');

      expect(controller.handleRecoverSubmit).toHaveBeenCalledWith('user@example.com');
    });

    it('is safe to call without an event', function() {
      spyOn(controller, 'handleRecoverSubmit');

      expect(() => controller.handleRecoverSubmitEvent(undefined, 'user@example.com')).not.toThrow();
      expect(controller.handleRecoverSubmit).toHaveBeenCalledWith('user@example.com');
    });
  });
});

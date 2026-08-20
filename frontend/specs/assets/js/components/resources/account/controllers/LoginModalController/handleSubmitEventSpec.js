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

  describe('#handleSubmitEvent', function() {
    it('prevents the default form submission', function() {
      const event = { preventDefault: jasmine.createSpy('preventDefault') };
      spyOn(controller, 'handleSubmit');

      controller.handleSubmitEvent(event, 'majora-user', 'secret');

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('delegates to handleSubmit with the given username/password', function() {
      spyOn(controller, 'handleSubmit');

      controller.handleSubmitEvent({ preventDefault: jasmine.createSpy() }, 'majora-user', 'secret');

      expect(controller.handleSubmit).toHaveBeenCalledWith('majora-user', 'secret');
    });

    it('is safe to call without an event', function() {
      spyOn(controller, 'handleSubmit');

      expect(() => controller.handleSubmitEvent(undefined, 'majora-user', 'secret')).not.toThrow();
      expect(controller.handleSubmit).toHaveBeenCalledWith('majora-user', 'secret');
    });
  });
});

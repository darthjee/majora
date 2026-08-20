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

  describe('#handleAuthorizeSubmitEvent', function() {
    it('prevents the default form submission', function() {
      const event = { preventDefault: jasmine.createSpy('preventDefault') };
      spyOn(controller, 'handleAuthorizeSubmit');

      controller.handleAuthorizeSubmitEvent(event, 'majora-user');

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('delegates to handleAuthorizeSubmit with the given username', function() {
      spyOn(controller, 'handleAuthorizeSubmit');

      controller.handleAuthorizeSubmitEvent({ preventDefault: jasmine.createSpy() }, 'majora-user');

      expect(controller.handleAuthorizeSubmit).toHaveBeenCalledWith('majora-user');
    });

    it('is safe to call without an event', function() {
      spyOn(controller, 'handleAuthorizeSubmit');

      expect(() => controller.handleAuthorizeSubmitEvent(undefined, 'majora-user')).not.toThrow();
      expect(controller.handleAuthorizeSubmit).toHaveBeenCalledWith('majora-user');
    });
  });
});

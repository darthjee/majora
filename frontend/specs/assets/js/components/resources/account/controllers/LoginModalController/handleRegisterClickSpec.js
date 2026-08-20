import LoginModalController from '../../../../../../../../assets/js/components/resources/account/controllers/LoginModalController.js';

describe('LoginModalController', function() {
  let controller;
  let originalWindow;

  beforeEach(function() {
    controller = new LoginModalController(
      jasmine.createSpy('setUsername'),
      jasmine.createSpy('setPassword'),
      jasmine.createSpy('setIncorrect'),
      jasmine.createSpy('setError')
    );
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  describe('#handleRegisterClick', function() {
    it('closes the modal', function() {
      const onClose = jasmine.createSpy('onClose');

      controller.handleRegisterClick(onClose);

      expect(onClose).toHaveBeenCalled();
    });

    it('navigates to the registration page', function() {
      controller.handleRegisterClick(jasmine.createSpy('onClose'));

      expect(globalThis.window.location.hash).toBe('/users/register');
    });

    it('does not throw when window is unavailable', function() {
      delete globalThis.window;

      expect(() => controller.handleRegisterClick(jasmine.createSpy('onClose'))).not.toThrow();
    });
  });
});

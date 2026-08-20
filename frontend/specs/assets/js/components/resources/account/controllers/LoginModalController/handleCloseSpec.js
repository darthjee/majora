import LoginModalController from '../../../../../../../../assets/js/components/resources/account/controllers/LoginModalController.js';

describe('LoginModalController', function() {
  let setUsername;
  let setPassword;
  let setIncorrect;
  let setError;
  let controller;

  beforeEach(function() {
    setUsername = jasmine.createSpy('setUsername');
    setPassword = jasmine.createSpy('setPassword');
    setIncorrect = jasmine.createSpy('setIncorrect');
    setError = jasmine.createSpy('setError');
    controller = new LoginModalController(setUsername, setPassword, setIncorrect, setError);
  });

  describe('#handleClose', function() {
    it('clears the form state', function() {
      controller.handleClose(jasmine.createSpy('onClose'));

      expect(setUsername).toHaveBeenCalledWith('');
      expect(setPassword).toHaveBeenCalledWith('');
      expect(setIncorrect).toHaveBeenCalledWith(false);
      expect(setError).toHaveBeenCalledWith(false);
    });

    it('invokes the given onClose callback', function() {
      const onClose = jasmine.createSpy('onClose');

      controller.handleClose(onClose);

      expect(onClose).toHaveBeenCalled();
    });

    it('is safe to call without an onClose callback', function() {
      expect(() => controller.handleClose()).not.toThrow();
    });
  });
});

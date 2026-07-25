import LoginModalController from '../../../../../../../../assets/js/components/resources/account/controllers/LoginModalController.js';

describe('LoginModalController', function() {
  let setUsername;
  let setPassword;
  let setIncorrect;
  let setError;
  let setAuthorizeStatus;
  let poller;

  beforeEach(function() {
    setUsername = jasmine.createSpy('setUsername');
    setPassword = jasmine.createSpy('setPassword');
    setIncorrect = jasmine.createSpy('setIncorrect');
    setError = jasmine.createSpy('setError');
    setAuthorizeStatus = jasmine.createSpy('setAuthorizeStatus');
    poller = { start: jasmine.createSpy('start'), stop: jasmine.createSpy('stop') };
  });

  describe('#handleAuthorizeReset', function() {
    it('stops the poller and resets the authorize status to null', function() {
      const controller = new LoginModalController(
        setUsername,
        setPassword,
        setIncorrect,
        setError,
        null,
        {},
        null,
        setAuthorizeStatus,
        poller
      );

      controller.handleAuthorizeReset();

      expect(poller.stop).toHaveBeenCalled();
      expect(setAuthorizeStatus).toHaveBeenCalledWith(null);
    });

    it('is safe to call without a setAuthorizeStatus setter', function() {
      const controller = new LoginModalController(
        setUsername,
        setPassword,
        setIncorrect,
        setError,
        null,
        {},
        null,
        null,
        poller
      );

      expect(() => controller.handleAuthorizeReset()).not.toThrow();
      expect(poller.stop).toHaveBeenCalled();
    });
  });
});

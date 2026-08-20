import LoginModalController from '../../../../../../../../assets/js/components/resources/account/controllers/LoginModalController.js';

describe('LoginModalController', function() {
  let setPassword;
  let setIncorrect;
  let setError;
  let setMode;
  let poller;
  let controller;

  beforeEach(function() {
    setPassword = jasmine.createSpy('setPassword');
    setIncorrect = jasmine.createSpy('setIncorrect');
    setError = jasmine.createSpy('setError');
    setMode = jasmine.createSpy('setMode');
    poller = { start: jasmine.createSpy('start'), stop: jasmine.createSpy('stop') };
    controller = new LoginModalController(
      jasmine.createSpy('setUsername'),
      setPassword,
      setIncorrect,
      setError,
      null,
      {},
      null,
      jasmine.createSpy('setAuthorizeStatus'),
      poller,
      setMode
    );
  });

  describe('#handleModeChange', function() {
    it('resets the authorize state', function() {
      controller.handleModeChange('recover');

      expect(poller.stop).toHaveBeenCalled();
    });

    it('clears the password and error fields', function() {
      controller.handleModeChange('recover');

      expect(setPassword).toHaveBeenCalledWith('');
      expect(setIncorrect).toHaveBeenCalledWith(false);
      expect(setError).toHaveBeenCalledWith(false);
    });

    it('switches to the given mode', function() {
      controller.handleModeChange('authorize');

      expect(setMode).toHaveBeenCalledWith('authorize');
    });
  });
});

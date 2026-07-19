import LoginModalController from '../../../../../../../../assets/js/components/resources/account/controllers/LoginModalController.js';

describe('LoginModalController', function() {
  let setUsername;
  let setPassword;
  let setIncorrect;
  let setError;
  let onSuccess;
  let client;
  let setRecoverySent;

  beforeEach(function() {
    setUsername = jasmine.createSpy('setUsername');
    setPassword = jasmine.createSpy('setPassword');
    setIncorrect = jasmine.createSpy('setIncorrect');
    setError = jasmine.createSpy('setError');
    onSuccess = jasmine.createSpy('onSuccess');
    setRecoverySent = jasmine.createSpy('setRecoverySent');
    client = {
      login: jasmine.createSpy('login'),
      recoverPassword: jasmine.createSpy('recoverPassword'),
    };
  });

  describe('#handleClear', function() {
    it('clears the form state', function() {
      const controller = new LoginModalController(
        setUsername,
        setPassword,
        setIncorrect,
        setError,
        onSuccess,
        client
      );

      controller.handleClear();

      expect(setUsername).toHaveBeenCalledWith('');
      expect(setPassword).toHaveBeenCalledWith('');
      expect(setIncorrect).toHaveBeenCalledWith(false);
      expect(setError).toHaveBeenCalledWith(false);
    });

    it('clears the recovery-sent flag when a setter is provided', function() {
      const controller = new LoginModalController(
        setUsername,
        setPassword,
        setIncorrect,
        setError,
        onSuccess,
        client,
        setRecoverySent
      );

      controller.handleClear();

      expect(setRecoverySent).toHaveBeenCalledWith(false);
    });
  });
});

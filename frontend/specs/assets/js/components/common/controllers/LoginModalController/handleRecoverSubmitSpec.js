import LoginModalController from '../../../../../../../assets/js/components/common/controllers/LoginModalController.js';

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

  describe('#handleRecoverSubmit', function() {
    it('requests password recovery and marks the email as sent', async function() {
      client.recoverPassword.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({ sent: true }) }));

      const controller = new LoginModalController(
        setUsername,
        setPassword,
        setIncorrect,
        setError,
        onSuccess,
        client,
        setRecoverySent
      );

      await controller.handleRecoverSubmit('user@example.com');

      expect(client.recoverPassword).toHaveBeenCalledWith('user@example.com');
      expect(setRecoverySent).toHaveBeenCalledWith(true);
    });

    it('still marks the email as sent when the request fails at the network level', async function() {
      client.recoverPassword.and.returnValue(Promise.reject(new Error('network')));

      const controller = new LoginModalController(
        setUsername,
        setPassword,
        setIncorrect,
        setError,
        onSuccess,
        client,
        setRecoverySent
      );

      await controller.handleRecoverSubmit('user@example.com');

      expect(setRecoverySent).toHaveBeenCalledWith(true);
    });
  });
});

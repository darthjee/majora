import LoginModalController from '../../../../../../../assets/js/components/common/controllers/LoginModalController.js';
import AuthEvents from '../../../../../../../assets/js/utils/auth/AuthEvents.js';
import AuthStorage from '../../../../../../../assets/js/utils/auth/AuthStorage.js';

describe('LoginModalController', function() {
  let setUsername;
  let setPassword;
  let setIncorrect;
  let setError;
  let onSuccess;
  let client;

  beforeEach(function() {
    setUsername = jasmine.createSpy('setUsername');
    setPassword = jasmine.createSpy('setPassword');
    setIncorrect = jasmine.createSpy('setIncorrect');
    setError = jasmine.createSpy('setError');
    onSuccess = jasmine.createSpy('onSuccess');
    client = {
      login: jasmine.createSpy('login'),
      recoverPassword: jasmine.createSpy('recoverPassword'),
    };
  });

  describe('#handleSubmit', function() {
    it('stores the token, emits auth:changed, and calls onSuccess on success', async function() {
      spyOn(AuthEvents, 'emit');
      spyOn(AuthStorage, 'setToken');
      client.login.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ token: 'tok-123' }),
      }));

      const controller = new LoginModalController(
        setUsername,
        setPassword,
        setIncorrect,
        setError,
        onSuccess,
        client
      );

      await controller.handleSubmit('majora-user', 'secret');

      expect(client.login).toHaveBeenCalledWith('majora-user', 'secret');
      expect(AuthStorage.setToken).toHaveBeenCalledWith('tok-123');
      expect(setUsername).toHaveBeenCalledWith('');
      expect(setPassword).toHaveBeenCalledWith('');
      expect(setIncorrect).toHaveBeenCalledWith(false);
      expect(setError).toHaveBeenCalledWith(false);
      expect(AuthEvents.emit).toHaveBeenCalledWith(true);
      expect(onSuccess).toHaveBeenCalled();
    });

    it('marks incorrect credentials on client errors', async function() {
      client.login.and.returnValue(Promise.resolve({ ok: false, status: 401 }));

      const controller = new LoginModalController(
        setUsername,
        setPassword,
        setIncorrect,
        setError,
        onSuccess,
        client
      );

      await controller.handleSubmit('majora-user', 'wrong-secret');

      expect(setPassword).toHaveBeenCalledWith('');
      expect(setIncorrect).toHaveBeenCalledWith(true);
      expect(setError).not.toHaveBeenCalledWith(true);
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('marks unexpected errors on server failures', async function() {
      client.login.and.returnValue(Promise.resolve({ ok: false, status: 500 }));

      const controller = new LoginModalController(
        setUsername,
        setPassword,
        setIncorrect,
        setError,
        onSuccess,
        client
      );

      await controller.handleSubmit('majora-user', 'secret');

      expect(setPassword).toHaveBeenCalledWith('');
      expect(setError).toHaveBeenCalledWith(true);
      expect(setIncorrect).not.toHaveBeenCalledWith(true);
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('marks unexpected errors when the client rejects', async function() {
      client.login.and.returnValue(Promise.reject(new Error('network')));

      const controller = new LoginModalController(
        setUsername,
        setPassword,
        setIncorrect,
        setError,
        onSuccess,
        client
      );

      await controller.handleSubmit('majora-user', 'secret');

      expect(setPassword).toHaveBeenCalledWith('');
      expect(setError).toHaveBeenCalledWith(true);
      expect(setIncorrect).not.toHaveBeenCalledWith(true);
    });
  });
});
